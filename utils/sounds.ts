
const SFX = {
  pop: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  snap: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  fanfare: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
  wrong: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'
};

export const playSound = (name: keyof typeof SFX, volume = 0.4) => {
  const audio = new Audio(SFX[name]);
  audio.volume = volume;
  audio.play().catch(() => {}); // Ignore browsers blocking auto-play
};
