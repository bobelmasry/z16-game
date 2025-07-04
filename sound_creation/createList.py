from pydub import AudioSegment
import librosa
import os

def mp3_to_wav(mp3_path, wav_path="temp.wav"):
    sound = AudioSegment.from_mp3(mp3_path)
    sound.export(wav_path, format="wav")
    return wav_path

def extract_instructions(wav_path, hop_length=512):
    y, sr = librosa.load(wav_path)
    
    f0, voiced_flag, voiced_probs = librosa.pyin(
        y,
        fmin=librosa.note_to_hz('C2'),
        fmax=librosa.note_to_hz('C7'),
        sr=sr,
        hop_length=hop_length
    )

    time_per_step = hop_length / sr
    instructions = []

    current_freq = None
    duration = 0

    for i, freq in enumerate(f0):
        if voiced_flag[i]:
            if current_freq is None:
                current_freq = freq
                duration = time_per_step
            elif abs(freq - current_freq) < 5:  # Tolerance to avoid flickering
                duration += time_per_step
            else:
                instructions.append((round(current_freq), round(duration * 1000)))
                current_freq = freq
                duration = time_per_step
        else:
            if current_freq is not None:
                instructions.append((round(current_freq), round(duration * 1000)))
                current_freq = None
                duration = 0

    if current_freq is not None:
        instructions.append((round(current_freq), round(duration * 1000)))

    return instructions

def main(mp3_file):
    output_string = ""
    wav_path = mp3_to_wav(mp3_file)
    instructions = extract_instructions(wav_path)
    os.remove(wav_path)
    print("Length of instructions:", len(instructions))

    for freq, duration in instructions:
        print(f"Tone: {freq} Hz, Duration: {duration} ms")
        output_string += "li a0, " + str(freq) + "\n"
        output_string += "li a1, " + str(duration) + "\n"
        output_string += "ecall 4\n"
    
    with open("sound.s", "w") as f:
        f.write(output_string)

    return instructions

# Example usage
if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python mp3_to_instructions.py input.mp3")
    else:
        main(sys.argv[1])
