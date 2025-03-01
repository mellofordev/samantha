import React, { useState } from "react";
import { ChevronDown, ChevronRight, FolderClosedIcon ,FolderOpenIcon} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./button";

interface FolderItemProps {
  icon?: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
}

const FolderItem = ({ icon, label, href, onClick }: FolderItemProps) => {
  return (
    <motion.a
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 text-sm text-white/90 hover:bg-white/10 rounded-md transition-colors"
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
    >
      {icon || <div className="w-5 h-5" />}
      <span>{label}</span>
    </motion.a>
  );
};

interface FolderProps {
  title: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function Folder({
  title,
  icon = <FolderClosedIcon className="h-5 w-5 text-white/70" />,
  children,
  defaultOpen = false,
  className,
}: FolderProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("mb-2", className)}>
      <Button
        className="w-full justify-between items-start"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-start gap-2">
         {isOpen ? <FolderOpenIcon className="h-5 w-5 text-white/70" /> : icon}
          <span className="text-white">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <ChevronDown className="h-4 w-4 text-white/70" />
        </motion.div>
      </Button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
            className="mt-1 ml-2 pl-2 border-l border-white/10"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { FolderItem }; 