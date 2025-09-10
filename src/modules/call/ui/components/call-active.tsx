import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CallControls,
  CallParticipantsList,
  CallStats,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  Video,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { MicIcon, PhoneOff, VideoIcon } from "lucide-react";

interface Props {
  onLeave: () => void;
  meetingName: string;

}

export const CallActive = ({ onLeave, meetingName }: Props) => {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  return (
    <div className="flex flex-col justify-between p-4 h-full text-white">
      <div className="bg-[#101213] rounded-full p-4 flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center justify-center p-1 bg-white/10 rounded-full w-fit"
        >
          <Image src="/bot.png" width={44} height={44} alt="Logo" />
        </Link>
        <h4 className="text-base uppercase">{meetingName}</h4>
        <p className="text-sm text-white">
          {participants.length} participants
        </p>
      </div>
      <SpeakerLayout />
      <div className="rounded-full px-4 bg-[#101213]  ">
        <CallControls onLeave={onLeave} />
      </div>
    </div>
  );
};
