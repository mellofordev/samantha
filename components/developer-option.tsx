import {useState,useEffect} from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Code } from "lucide-react"
import { Button } from "./ui/button";
import { Input } from "./ui/input";
export function DeveloperOption() {
  const [open, setOpen] = useState(false)
  const [input,setInput] = useState("");
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [input]) // Add input to dependency array


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      
      <DialogContent className="max-w-[640px] gap-0 p-0 bg-black/10 backdrop-blur-xl border border-white/10">
      <DialogHeader>
        <DialogTitle></DialogTitle>
      </DialogHeader>
        <div className="flex items-center p-4 space-x-3 h-20">
          <Code className="h-5 w-5 text-white/70" />
          <Input type="text" className="h-24" placeholder="MCP server" />
        </div>
        <hr className="border-white/10 border-dashed" />
        <div className="flex flex-row justify-between items-center p-4"> 
            <p className="text-white/50 text-sm">Add your MCP server</p>
            <Button>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 