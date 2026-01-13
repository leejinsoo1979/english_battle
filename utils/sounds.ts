
const SFX = {
  pop: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  snap: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  fanfare: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
  wrong: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
  // 대전 모드 사운드
  punch: 'https://assets.mixkit.co/active_storage/sfx/2803/2803-preview.mp3',
  hit: 'https://assets.mixkit.co/active_storage/sfx/2785/2785-preview.mp3',
  ko: 'https://assets.mixkit.co/active_storage/sfx/2658/2658-preview.mp3',
  fight: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  round: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3',
  combo: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
  critical: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3',
  win: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  countdown: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
};

export const playSound = (name: keyof typeof SFX, volume = 0.4) => {
  const audio = new Audio(SFX[name]);
  audio.volume = volume;
  audio.play().catch(() => {}); // Ignore browsers blocking auto-play
};
