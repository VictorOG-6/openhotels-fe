"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getAvatarColors, getInitials } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  seed?: string;
  src?: string;
  className?: string;
  fallbackClassName?: string;
  size?: "default" | "sm" | "lg";
}

const UserAvatar = ({
  name,
  seed,
  src,
  className,
  fallbackClassName,
  size = "default",
}: UserAvatarProps) => {
  const avatarSeed = seed || name;
  const { backgroundColor, color } = getAvatarColors(avatarSeed);
  const initials = getInitials(name);

  return (
    <Avatar size={size} className={className}>
      {src ? <AvatarImage src={src} alt={name} /> : null}
      <AvatarFallback
        className={cn("font-semibold", fallbackClassName)}
        style={{ backgroundColor, color }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
