"use client";

import { LoaderIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Call,
  CallingState,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
} from "@stream-io/video-react-sdk";
import { useMutation } from "@tanstack/react-query";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useTRPC } from "@/app/api/trpc/client";
import { CallUI } from "./callui";

interface Props {
  meetingId: string;
  meetingName: string;
  userId: string;
  userName: string;
  userImage: string;
}

export const CallConnect = ({
  meetingId,
  meetingName,
  userId,
  userName,
  userImage,
}: Props) => {
  const trpc = useTRPC();
  const { mutateAsync: generateToken } = useMutation(
    trpc.meetings.generateToken.mutationOptions()
  );


  const [client, setClient] = useState<StreamVideoClient>();
  const [call, setCall] = useState<Call>();

  // Create/destroy Stream client (no call.leave here)
  useEffect(() => {
    const _client = new StreamVideoClient({
      apiKey: process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!,
      user: {
        id: userId,
        name: userName,
        image: userImage,
      },
      tokenProvider: generateToken, // returns a Promise<string>
    });

    setClient(_client);

    return () => {
      _client.disconnectUser(); // only disconnect the user
      setClient(undefined);
    };
  }, [userId, userImage, userName, generateToken]);

  // Create call instance (no leave/endCall in cleanup)
  useEffect(() => {
    if (!client) return;

    const _call = client.call("default", meetingId);
    // optional: start with devices disabled
    _call.camera.disable();
    _call.microphone.disable();

    setCall(_call);

    return () => {
      // intentionally do NOT call _call.leave() here
      setCall(undefined);
    };
  }, [client, meetingId]);

  if (!client || !call) {
    return (
      <div className="flex h-screen items-center justify-center bg-radial from-sidebar-accent to-sidebar">
        <LoaderIcon className="size-6 animate-spin text-black" />
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <CallUI meetingName={meetingName} />
      </StreamCall>
    </StreamVideo>
  );
};
