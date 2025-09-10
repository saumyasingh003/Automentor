import { createAvatar } from "@dicebear/core";
import { botttsNeutral, initials } from "@dicebear/collection";

interface Props {
  seed: string;
  variant: "botttsNeutral" | "initials";
}

export const generateAvatarUri = ({ seed, variant }: Props): string => {
  let avatar;

  switch (variant) {
    case "botttsNeutral":
      avatar = createAvatar(botttsNeutral, { seed });
      break;

    case "initials":
      avatar = createAvatar(initials, { 
        seed, 
        fontWeight: 500, 
        fontSize: 42 
      });
      break;

    default:
      throw new Error("Unsupported avatar variant");
  }

  return avatar.toDataUri(); // ✅ safer, since it's synchronous
};
