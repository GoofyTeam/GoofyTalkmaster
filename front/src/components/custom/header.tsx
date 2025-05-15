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
import { ModeToggle } from "../mode-toggle";

interface HeaderProps {
  className?: string;
}

export const Header = ({ className }: HeaderProps) => {
  const { user, isAuthenticated, role } = useAuth();

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
                <Avatar className="cursor-pointer hover:opacity-80 !rounded-md h-9 w-9">
                  <AvatarImage
                    className="rounded-md"
                    src={user?.profile_picture || ""}
                    alt={`${user?.firstname || ""} ${user?.lastname || ""}`}
                  />
                  <AvatarFallback className="rounded-md">
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
                <DropdownMenuItem asChild>
                  <Link to="/favoris" className="cursor-pointer w-full">
                    Favoris
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {role === "public" ? (
                  <DropdownMenuItem asChild>
                    <Link
                      to="/account/become-speaker"
                      className="cursor-pointer w-full"
                    >
                      Devenir conférencier
                    </Link>
                  </DropdownMenuItem>
                ) : role === "speaker" ||
                  role === "organizer" ||
                  role === "superadmin" ? (
                  <DropdownMenuItem asChild>
                    <Link to="/manage" className="cursor-pointer w-full">
                      Espace conférencier
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                {role === "organizer" || role === "superadmin" ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/manage" className="cursor-pointer w-full">
                        Espace gestionnaire
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        to="/manage/speaker-request"
                        className="cursor-pointer w-full"
                      >
                        Demandes de promotion
                      </Link>
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth/login" className="hover:opacity-80">
              Connexion
            </Link>
          )}
          <ModeToggle />
        </nav>
      </div>
    </header>
  );
};
