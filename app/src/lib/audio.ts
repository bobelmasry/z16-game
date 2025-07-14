const audioCtx = window ? (new (window.AudioContext || (window as any).webkitAudioContext)()) : null;
let audioQueue: Promise<void> = Promise.resolve();

export function playTone(frequency: number, duration: number) {
    if (!audioCtx) {
        return;
    }
    audioQueue = audioQueue.then(() => {
        return new Promise<void>((resolve) => {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            gainNode.gain.setValueAtTime(1.0, audioCtx.currentTime);
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + duration / 1000);

            oscillator.onended = () => {
                oscillator.disconnect();
                resolve();
            };
        });
    });
}
