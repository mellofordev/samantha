'use server'

import { PrismaClient } from "@prisma/client"
import { currentUser } from '@clerk/nextjs/server'


const prisma = new PrismaClient()

export async function getCurrentUser() {
    const user = await currentUser()
    if (!user) return null
    
    return user.id
}

export async function saveSearchHistory(query: string, result: string) {
    const clerkId = await getCurrentUser()
    if (!clerkId) return null
    
    try {
        const searchHistory = await prisma.searchHistory.create({
            data: {
                clerk_reference_id: clerkId,
                query,
                result
            }
        })
        return searchHistory
    } catch (error) {
        console.error("Error saving search history:", error)
        return null
    }
}

export async function getSearchHistory(limit = 10) {
    try {
        const clerkId = await getCurrentUser()
        if (!clerkId) return []
        
        const searchHistory = await prisma.searchHistory.findMany({
            where: {
                clerk_reference_id: clerkId
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        })
        
        return searchHistory
    } catch (error) {
        console.error("Error fetching search history:", error instanceof Error ? error.message : "Unknown error")
        return []
    }
}
export async function saveUserLocation(location: string) {
    try {
        const clerkId = await getCurrentUser()
        if (!clerkId) return null
        
        // Get the user from Clerk to access their email
        const user = await currentUser()
        if (!user || !user.emailAddresses || user.emailAddresses.length === 0) {
            return null
        }
        
        const primaryEmail = user.emailAddresses[0].emailAddress
        
        const dbUser = await prisma.user.upsert({
            where: {
                clerk_reference_id: clerkId
            },
            update: {
                location: location
            },
            create: {
                clerk_reference_id: clerkId,
                email: primaryEmail,
                location: location
            }
        })
        
        return dbUser
    } catch (error) {
        // Use a string message instead of potentially null error object
        console.error("Error saving user location:", error instanceof Error ? error.message : "Unknown error")
        return null
    }
}
export async function getUserLocation() {
    const clerkId = await getCurrentUser()
    if (!clerkId) return null
    
    try {
        const user = await prisma.user.findUnique({
            where: {
                clerk_reference_id: clerkId
            },
            select: {
                location: true
            }
        })
        
        if (!user) {
            return null
        }
        
        return user.location
    } catch (error) {
        console.error("Error fetching user location:", error)
        return null
    }
}


export async function getUserPreference() {
    const clerkId = await getCurrentUser()
    if (!clerkId) return null
    
    try {
        const user = await prisma.user.findUnique({
            where: {
                clerk_reference_id: clerkId
            },
            select: {
            userPreferencePrompt: true
            }
        })
        
        if (!user) {
            return null
        }
        
        return user.userPreferencePrompt
    } catch (error) {
        console.error("Error fetching user preference:", error)
        return null
    }
}
export async function saveUserPreference(prompt: string) {
    const userId = await getCurrentUser()
    if (!userId) return null
    
    try {
        // Get the user from Clerk to access their email
        const user = await currentUser()
        if (!user || !user.emailAddresses || user.emailAddresses.length === 0) {
            throw new Error("User email not available")
        }
        
        const primaryEmail = user.emailAddresses[0].emailAddress
        
        const dbUser = await prisma.user.upsert({
            where: {
                clerk_reference_id: userId
            },
            update: {
                userPreferencePrompt: prompt
            },
            create: {
                clerk_reference_id: userId,
                email: primaryEmail,
                userPreferencePrompt: prompt
            }
        })
        
        return dbUser
    } catch (error) {
        console.error("Error saving user preference:", error)
        return null
    }
}

export async function getFolders() {
    try {
        const clerkId = await getCurrentUser()
        if (!clerkId) return []
        
        const folders = await prisma.folder.findMany({
            where: {
                clerk_reference_id: clerkId
            },
            include: {
                files: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        
        return folders
    } catch (error) {
        console.error("Error fetching folders:", error instanceof Error ? error.message : "Unknown error")
        return []
    }
}

export async function createFolder(folderName: string, content: any = null, contentType: 'urls' | 'knowledge_graph' = 'urls') {
    try {
        const clerkId = await getCurrentUser();
        if (!clerkId) return null;
        
        // Get the user from Clerk to access their email
        const user = await currentUser();
        if (!user || !user.emailAddresses || user.emailAddresses.length === 0) {
            return null;
        }
        
        // Create a new folder
        const folder = await prisma.folder.create({
            data: {
                clerk_reference_id: clerkId,
                folder_name: folderName,
                createdAt: new Date()
            }
        });
        
        // Handle different content types
        if (content) {
            if (contentType === 'urls' && Array.isArray(content)) {
                console.log(`Creating ${content.length} URL files in folder ${folder.id}`);
                
                // Create files for each URL
                for (const item of content) {
                    try {
                        const file = await prisma.file.create({
                            data: {
                                file_name: item.title || "Untitled",
                                file_type: "url",
                                json_content: JSON.stringify({
                                    url: item.url || "",
                                    title: item.title || "Untitled",
                                    content: item.content || ""
                                }),
                                folder_id: folder.id
                            }
                        });
                        console.log(`Created URL file: ${file.id} - ${file.file_name}`);
                    } catch (fileError) {
                        console.error(`Error creating URL file: ${fileError instanceof Error ? fileError.message : "Unknown error"}`);
                    }
                }
                
                // Also create a knowledge graph file with the search results
                try {
                    // Ensure the content has the correct structure for the KnowledgeGraphBento component
                    const knowledgeGraphData = {
                        title: folderName,
                        description: `Collection of ${content.length} search results`,
                        imageUrl: content[0]?.imageUrl || "/placeholder.svg",
                        relatedTopics: [],
                        videoResult: [],
                        imageGallery: [],
                        quick_insights: [],
                        search_results: content
                    };
                    
                    const file = await prisma.file.create({
                        data: {
                            file_name: `${folderName} Knowledge Graph`,
                            file_type: "knowledge_graph",
                            json_content: JSON.stringify(knowledgeGraphData),
                            folder_id: folder.id
                        }
                    });
                    console.log(`Created knowledge graph file from URLs: ${file.id} - ${file.file_name}`);
                } catch (fileError) {
                    console.error(`Error creating knowledge graph file from URLs: ${fileError instanceof Error ? fileError.message : "Unknown error"}`);
                }
            } else if (contentType === 'knowledge_graph') {
                console.log(`Creating knowledge graph file in folder ${folder.id}`);
                
                try {
                    // Ensure the content has the correct structure for the KnowledgeGraphBento component
                    let knowledgeGraphData;
                    
                    if (typeof content === 'string') {
                        try {
                            knowledgeGraphData = JSON.parse(content);
                        } catch (parseError) {
                            console.error("Error parsing knowledge graph content:", parseError);
                            knowledgeGraphData = createDefaultKnowledgeGraph(folderName);
                        }
                    } else {
                        knowledgeGraphData = content;
                    }
                    
                    // Ensure all required fields exist
                    const validatedData = ensureValidKnowledgeGraphStructure(knowledgeGraphData, folderName);
                    
                    // Create the knowledge graph file
                    const file = await prisma.file.create({
                        data: {
                            file_name: `${folderName} Knowledge Graph`,
                            file_type: "knowledge_graph",
                            json_content: JSON.stringify(validatedData),
                            folder_id: folder.id
                        }
                    });
                    console.log(`Created knowledge graph file: ${file.id} - ${file.file_name}`);
                    
                    // Also create individual URL files for each search result
                    if (validatedData.search_results && Array.isArray(validatedData.search_results) && validatedData.search_results.length > 0) {
                        console.log(`Creating ${validatedData.search_results.length} URL files from knowledge graph in folder ${folder.id}`);
                        
                        for (const item of validatedData.search_results) {
                            try {
                                const file = await prisma.file.create({
                                    data: {
                                        file_name: item.title || "Untitled",
                                        file_type: "url",
                                        json_content: JSON.stringify({
                                            url: item.url || "",
                                            title: item.title || "Untitled",
                                            content: item.content || ""
                                        }),
                                        folder_id: folder.id
                                    }
                                });
                                console.log(`Created URL file from knowledge graph: ${file.id} - ${file.file_name}`);
                            } catch (fileError) {
                                console.error(`Error creating URL file from knowledge graph: ${fileError instanceof Error ? fileError.message : "Unknown error"}`);
                            }
                        }
                    }
                } catch (fileError) {
                    console.error(`Error creating knowledge graph file: ${fileError instanceof Error ? fileError.message : "Unknown error"}`);
                }
            }
        } else {
            console.log(`No content provided for folder ${folder.id}`);
            
            // Create a default knowledge graph file
            try {
                const defaultData = createDefaultKnowledgeGraph(folderName);
                
                const file = await prisma.file.create({
                    data: {
                        file_name: `${folderName} Knowledge Graph`,
                        file_type: "knowledge_graph",
                        json_content: JSON.stringify(defaultData),
                        folder_id: folder.id
                    }
                });
                console.log(`Created default knowledge graph file: ${file.id} - ${file.file_name}`);
                
                // Create a placeholder URL file
                if (defaultData.search_results && defaultData.search_results.length > 0) {
                    const searchResult = defaultData.search_results[0] as { title?: string, url?: string, content?: string };
                    const placeholderFile = await prisma.file.create({
                        data: {
                            file_name: searchResult.title || "Placeholder",
                            file_type: "url",
                            json_content: JSON.stringify(searchResult),
                            folder_id: folder.id
                        }
                    });
                    console.log(`Created placeholder URL file: ${placeholderFile.id} - ${placeholderFile.file_name}`);
                }
            } catch (fileError) {
                console.error(`Error creating default knowledge graph file: ${fileError instanceof Error ? fileError.message : "Unknown error"}`);
            }
        }
        
        // Return the folder with its files
        const folderWithFiles = await prisma.folder.findUnique({
            where: {
                id: folder.id
            },
            include: {
                files: true
            }
        });
        
        return folderWithFiles;
    } catch (error) {
        console.error("Error creating folder:", error instanceof Error ? error.message : "Unknown error");
        return null;
    }
}

// Helper function to create a default knowledge graph structure
function createDefaultKnowledgeGraph(title: string) {
    return {
        title: title,
        description: `Information about ${title}`,
        imageUrl: "/placeholder.svg",
        relatedTopics: [],
        videoResult: [],
        imageGallery: [],
        quick_insights: [
            {
                title: "Created Folder",
                emoji: "📁",
                content: `This folder was created to store information about ${title}`
            }
        ],
        search_results: []
    };
}

// Helper function to ensure a knowledge graph has all required fields
function ensureValidKnowledgeGraphStructure(data: any, folderName: string) {
    const defaultData = createDefaultKnowledgeGraph(folderName);
    
    return {
        title: data.title || defaultData.title,
        description: data.description || defaultData.description,
        imageUrl: data.imageUrl || defaultData.imageUrl,
        relatedTopics: Array.isArray(data.relatedTopics) ? data.relatedTopics : defaultData.relatedTopics,
        videoResult: Array.isArray(data.videoResult) ? data.videoResult : defaultData.videoResult,
        imageGallery: Array.isArray(data.imageGallery) ? data.imageGallery : defaultData.imageGallery,
        quick_insights: Array.isArray(data.quick_insights) ? data.quick_insights : defaultData.quick_insights,
        search_results: Array.isArray(data.search_results) ? data.search_results : defaultData.search_results
    };
}

export async function deleteFolder(folderId: string) {
    try {
        const clerkId = await getCurrentUser();
        if (!clerkId) return null;
        
        // First, delete all files in the folder
        await prisma.file.deleteMany({
            where: {
                folder_id: folderId
            }
        });
        
        // Then delete the folder itself
        const deletedFolder = await prisma.folder.delete({
            where: {
                id: folderId
            }
        });
        
        return deletedFolder;
    } catch (error) {
        console.error("Error deleting folder:", error instanceof Error ? error.message : "Unknown error");
        return null;
    }
}

export async function renameFolder(folderId: string, newName: string) {
    try {
        const clerkId = await getCurrentUser();
        if (!clerkId) return null;
        
        const updatedFolder = await prisma.folder.update({
            where: {
                id: folderId
            },
            data: {
                folder_name: newName
            },
            include: {
                files: true
            }
        });
        
        return updatedFolder;
    } catch (error) {
        console.error("Error renaming folder:", error instanceof Error ? error.message : "Unknown error");
        return null;
    }
}



