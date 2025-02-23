import { useState, useRef } from "react";
import { transcribeAudio } from "../api/openaiService";

const VoiceToText = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        setIsProcessing(true);

        try {
          const transcription = await transcribeAudio(audioBlob);
          setTranscribedText(transcription);
          console.log("Transcription:", transcription);
        } catch (error) {
          setTranscribedText("Error transcribing audio");
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
  };

  return (
    <div className="voice-chat">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        style={{
          backgroundColor: isRecording ? "#ff4444" : "#4CAF50",
          color: "white",
          padding: "10px 20px",
          border: "none",
          borderRadius: "50%",
          width: "50px",
          height: "50px",
          cursor: isProcessing ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span role="img" aria-label="microphone">
          {isProcessing ? "⏳" : isRecording ? "🔴" : "🎤"}
        </span>
      </button>

      {transcribedText && (
        <div
          className="transcription"
          style={{
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "#e8f5e9",
            borderRadius: "8px",
          }}
        >
          <p>{transcribedText}</p>
        </div>
      )}
    </div>
  );
};

export default VoiceToText;
