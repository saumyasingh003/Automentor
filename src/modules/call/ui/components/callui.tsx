"use client";

import { useRef, useState } from "react";
import {
  CallingState,
  StreamTheme,
  useCall,
} from "@stream-io/video-react-sdk";
import { CallLobby } from "./call-lobby";
import { CallActive } from "./call-active";
import { CallEnded } from "./call-ended";

interface Props {
  meetingName: string;
}

export const CallUI = ({ meetingName }: Props) => {
  const call = useCall();
  const [show, setShow] = useState<"lobby" | "call" | "ended">("lobby");
  const leavingRef = useRef(false); // prevents double-leave

  const handleJoin = async () => {
    if (!call) return;

    const state = call.state.callingState;
    if (state === CallingState.JOINED || state === CallingState.JOINING) {
      setShow("call");
      return;
    }

    await call.join();
    setShow("call");
  };

  const handleLeave = async () => {
    if (!call) return;

    // prevent duplicate invocations (double click / race)
    if (leavingRef.current) {
      setShow("ended");
      return;
    }
    leavingRef.current = true;

    const state = call.state.callingState;
    if (state === CallingState.LEFT) {
      setShow("ended");
      return;
    }

    try {
      await call.leave();
    } catch (e) {
      // If already left, suppress the SDK error and continue UX
      // @ts-expect-error loose error shape
      if (!(e && typeof e.message === "string" && e.message.includes("already been left"))) {
        // Optionally log other errors
        // console.warn("Error on leave:", e);
      }
    } finally {
      setShow("ended");
    }
  };

  return (
    <StreamTheme className="h-full">
      {show === "lobby" && <CallLobby onJoin={handleJoin} />}
      {show === "call" && (
        <CallActive onLeave={handleLeave} meetingName={meetingName} />
      )}
      {show === "ended" && <CallEnded />}
    </StreamTheme>
  );
};
