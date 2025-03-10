import Link from "next/link";
import { Github, Linkedin } from "lucide-react";

interface FooterProps {
  githubUrl: string;
  linkedinUrl: string;
  developerName: string;
}

export default function Footer({ githubUrl, linkedinUrl, developerName }: FooterProps) {
  return (
    <footer className="w-full py-4 px-4 mt-auto">
      <div className="container mx-auto flex flex-col sm:flex-row justify-center items-center gap-2 text-orange-800">
        <span className="text-sm">Developed by {developerName}</span>
        <div className="flex gap-2 items-center">
          <Link 
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-700 hover:text-orange-900 transition-colors"
            aria-label="GitHub Profile"
          >
            <Github className="h-5 w-5" />
          </Link>
          <Link 
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-700 hover:text-orange-900 transition-colors"
            aria-label="LinkedIn Profile"
          >
            <Linkedin className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
