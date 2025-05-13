import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

interface HeaderProps {
  className?: string;
}

export const Header = ({ className }: HeaderProps) => {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-16 items-center border-b bg-background px-6",
        className,
      )}
    >
      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-bold">
            GoofyTalkmaster
          </Link>
        </div>
        <nav className="flex items-center gap-4">
          <Link to="/account" className="hover:opacity-80">
            <Avatar>
              <AvatarImage src="" alt="Avatar" />
              <AvatarFallback>CT</AvatarFallback>
            </Avatar>
          </Link>
        </nav>
      </div>
    </header>
  );
};
