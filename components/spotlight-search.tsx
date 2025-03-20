import {useState,useEffect} from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "./ui/input"
import { CommandIcon, Search } from "lucide-react"
import { Button } from "./ui/button"
import { useLiveAPIContext } from "@/contexts/LiveAPIContext"
export function SpotlightSearch() {
  const { client,connect,connected } = useLiveAPIContext()
  const [open, setOpen] = useState(false)
  const [input,setInput] = useState("");
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
      if(e.key === "Enter" && input.trim()){
        handleSearch()
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [input]) // Add input to dependency array

  const handleSearch = () => {
    if (!input.trim()) return; // Don't send empty searches
    if(connected===false){
      connect()
    }
    client.send({
        text: `user search ${input} \n call web search tool`
    })
    setInput("") // Clear input after search
    setOpen(false) // Close dialog after search
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      
      <DialogContent className="max-w-[640px] gap-0 p-0 bg-black/10 backdrop-blur-xl border border-white/10">
      <DialogHeader>
        <DialogTitle></DialogTitle>
      </DialogHeader>
        <div className="flex items-center p-4 space-x-3 h-20">
          <Search className="h-5 w-5 text-white/70" />
          <Input
            type="text"
            placeholder="Search..."
            value={input}
            className="flex-1 bg-transparent border-0 outline-none text-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-0 focus:border-0 focus-visible:ring-0 focus-visible:outline-none focus-visible:border-0 shadow-none"
            onChange={(e)=>{setInput(e.target.value)}}
            onKeyDown={(e) => {
              if(e.key === "Enter" && input.trim()) {
                handleSearch()
              }
            }}
          />
          {/* <Button variant='secondary' className="bg-white/10 text-black hover:bg-white/20">
              Search web
          </Button> */}
        </div>
        <hr className="border-white/10 border-dashed" />
        <p className="text-white/50 text-sm p-4">Press Enter to search</p>
      </DialogContent>
    </Dialog>
  )
} 