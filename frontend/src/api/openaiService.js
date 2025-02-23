import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Note: Be cautious with this in production
});

export const transcribeAudio = async (audioBlob) => {
  try {
    // Convert audio to mp3 format using Web Audio API
    const audioContext = new AudioContext();
    const audioData = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(audioData);

    // Create a new audio file with proper format
    const mp3Blob = await convertToMp3(audioBuffer);
    const file = new File([mp3Blob], "audio.mp3", { type: "audio/mp3" });

    const response = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      response_format: "text",
    });

    return response;
  } catch (error) {
    console.error("Transcription error:", error);
    throw error;
  }
};

// Helper function to convert audio to MP3 format
async function convertToMp3(audioBuffer) {
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineContext.destination);
  source.start();

  const renderedBuffer = await offlineContext.startRendering();
  const wav = audioBufferToWav(renderedBuffer);
  return new Blob([wav], { type: "audio/mp3" });
}

// Helper function to convert AudioBuffer to WAV format
function audioBufferToWav(buffer) {
  const numberOfChannels = buffer.numberOfChannels;
  const length = buffer.length * numberOfChannels * 2;
  const wav = new DataView(new ArrayBuffer(44 + length));

  // WAV Header
  writeString(wav, 0, "RIFF");
  wav.setUint32(4, 36 + length, true);
  writeString(wav, 8, "WAVE");
  writeString(wav, 12, "fmt ");
  wav.setUint32(16, 16, true);
  wav.setUint16(20, 1, true);
  wav.setUint16(22, numberOfChannels, true);
  wav.setUint32(24, buffer.sampleRate, true);
  wav.setUint32(28, buffer.sampleRate * numberOfChannels * 2, true);
  wav.setUint16(32, numberOfChannels * 2, true);
  wav.setUint16(34, 16, true);
  writeString(wav, 36, "data");
  wav.setUint32(40, length, true);

  // Write audio data
  const channels = [];
  for (let i = 0; i < numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      wav.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true
      );
      offset += 2;
    }
  }

  return wav.buffer;
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export const getChatResponse = async (message) => {
  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: message }],
      model: "gpt-3.5-turbo",
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Chat completion error:", error);
    throw error;
  }
};
