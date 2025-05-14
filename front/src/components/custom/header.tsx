import { useAuth } from "@/auth/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

interface HeaderProps {
  className?: string;
}

export const Header = ({ className }: HeaderProps) => {
  const { user, isAuthenticated } = useAuth();

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
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer hover:opacity-80">
                  <AvatarImage
                    src={user?.profile_picture || ""}
                    alt={`${user?.firstname || ""} ${user?.lastname || ""}`}
                  />
                  <AvatarFallback>
                    {user?.firstname?.[0] || ""}
                    {user?.lastname?.[0] || ""}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/account" className="cursor-pointer w-full">
                    Profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/favoris" className="cursor-pointer w-full">
                    Favoris
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth/login" className="hover:opacity-80">
              Connexion
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};
