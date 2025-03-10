import Link from "next/link";
import { Github, Linkedin } from "lucide-react";

export default function CompactFooter({ 
  githubUrl, 
  linkedinUrl, 
  developerName 
}: { 
  githubUrl: string;
  linkedinUrl: string;
  developerName: string;
}) {
  return (
    <div className="text-xs text-orange-600 flex items-center justify-center gap-2 py-2">
      <span>© {developerName}</span>
      <div className="flex gap-1">
        <Link href={githubUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
          <Github className="h-3 w-3" />
        </Link>
        <Link href={linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
          <Linkedin className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
