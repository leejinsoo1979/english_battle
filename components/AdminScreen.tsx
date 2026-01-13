import React, { useState } from 'react';
import { QuizLevel, PhonicsRule } from '../types';
import { generateImageWithGemini, searchUnsplashImage } from '../utils/imageGenerator';

interface Props {
  levels: QuizLevel[];
  onSaveLevels: (levels: QuizLevel[]) => void;
  onBack: () => void;
}

const PHONICS_PRESETS: { name: string; description: string; color: string }[] = [
  { name: 'Magic E', description: 'The silent E makes the vowel say its name.', color: 'text-pink-500' },
  { name: 'Digraph sh', description: 'S and H together make one sound: /sh/', color: 'text-orange-500' },
  { name: 'Digraph ch', description: 'C and H together make one sound: /ch/', color: 'text-blue-500' },
  { name: 'Digraph th', description: 'T and H together make one sound: /th/', color: 'text-green-500' },
  { name: 'Long vowel', description: 'The vowel says its name.', color: 'text-purple-500' },
  { name: 'Short vowel', description: 'The vowel makes a short sound.', color: 'text-red-500' },
];

const AdminScreen: React.FC<Props> = ({ levels, onSaveLevels, onBack }) => {
  const [editingLevel, setEditingLevel] = useState<QuizLevel | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [sentence, setSentence] = useState('');
  const [targetWord, setTargetWord] = useState('');
  const [imageHint, setImageHint] = useState('');
  const [distractors, setDistractors] = useState('');
  const [selectedPhonics, setSelectedPhonics] = useState<string>('');
  const [phonicsIndices, setPhonicsIndices] = useState('');

  // Image generation state
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');

  const resetForm = () => {
    setSentence('');
    setTargetWord('');
    setImageHint('');
    setDistractors('');
    setSelectedPhonics('');
    setPhonicsIndices('');
    setImagePrompt('');
    setGenerationError('');
    setEditingLevel(null);
    setIsCreating(false);
  };

  const loadLevelToForm = (level: QuizLevel) => {
    setSentence(level.sentence);
    setTargetWord(level.targetWord);
    setImageHint(level.imageHint);
    setDistractors(level.distractors.join(', '));
    if (level.phonicsRules && level.phonicsRules.length > 0) {
      setSelectedPhonics(level.phonicsRules[0].name);
      setPhonicsIndices(level.phonicsRules[0].indices.join(', '));
    } else {
      setSelectedPhonics('');
      setPhonicsIndices('');
    }
    setImagePrompt('');
    setGenerationError('');
    setEditingLevel(level);
    setIsCreating(false);
  };

  const handleGenerateImage = async (useAI: boolean = true) => {
    const prompt = imagePrompt.trim() || targetWord.trim();
    if (!prompt) {
      setGenerationError('이미지를 생성하려면 프롬프트나 정답 단어를 입력하세요.');
      return;
    }

    setIsGenerating(true);
    setGenerationError('');

    try {
      const result = useAI
        ? await generateImageWithGemini(prompt)
        : await searchUnsplashImage(prompt);

      if (result.success && result.imageUrl) {
        setImageHint(result.imageUrl);
      } else {
        setGenerationError(result.error || '이미지 생성에 실패했습니다.');
      }
    } catch (error) {
      setGenerationError('이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!sentence.includes('____')) {
      alert('문장에 빈칸(____) 을 포함해야 합니다.');
      return;
    }
    if (!targetWord.trim()) {
      alert('정답 단어를 입력하세요.');
      return;
    }

    const distractorArray = distractors
      .split(',')
      .map(d => d.trim())
      .filter(d => d.length === 1);

    let phonicsRules: PhonicsRule[] | undefined;
    if (selectedPhonics) {
      const preset = PHONICS_PRESETS.find(p => p.name === selectedPhonics);
      if (preset) {
        const indices = phonicsIndices
          .split(',')
          .map(i => parseInt(i.trim()))
          .filter(i => !isNaN(i));
        phonicsRules = [{
          name: preset.name,
          description: preset.description,
          color: preset.color,
          indices: indices.length > 0 ? indices : [0],
        }];
      }
    }

    const newLevel: QuizLevel = {
      id: editingLevel ? editingLevel.id : Date.now(),
      sentence: sentence.trim(),
      targetWord: targetWord.trim().toLowerCase(),
      imageHint: imageHint.trim() || 'https://images.unsplash.com/photo-1606567595334-d39972c85dfd?w=400',
      distractors: distractorArray,
      phonicsRules,
    };

    let updatedLevels: QuizLevel[];
    if (editingLevel) {
      updatedLevels = levels.map(l => l.id === editingLevel.id ? newLevel : l);
    } else {
      updatedLevels = [...levels, newLevel];
    }

    onSaveLevels(updatedLevels);
    resetForm();
  };

  const handleDelete = (id: number) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      onSaveLevels(levels.filter(l => l.id !== id));
    }
  };

  const startCreating = () => {
    resetForm();
    setIsCreating(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow hover:shadow-md transition"
          >
            <i className="fa-solid fa-arrow-left text-gray-600"></i>
            <span className="font-medium text-gray-700">게임으로 돌아가기</span>
          </button>
          <h1 className="text-2xl font-fredoka text-gray-800">
            <i className="fa-solid fa-gear text-orange-500 mr-2"></i>
            레벨 관리
          </h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Level List */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-700">
                <i className="fa-solid fa-list mr-2 text-orange-400"></i>
                레벨 목록 ({levels.length})
              </h2>
              <button
                onClick={startCreating}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition"
              >
                <i className="fa-solid fa-plus mr-1"></i> 새 레벨
              </button>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {levels.map((level, idx) => (
                <div
                  key={level.id}
                  className={`p-4 rounded-xl border-2 transition cursor-pointer ${
                    editingLevel?.id === level.id
                      ? 'border-orange-400 bg-orange-50'
                      : 'border-gray-100 hover:border-orange-200'
                  }`}
                  onClick={() => loadLevelToForm(level)}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={level.imageHint}
                      alt={level.targetWord}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-orange-500">#{idx + 1}</span>
                        <span className="font-fredoka text-lg text-gray-800">{level.targetWord}</span>
                        {level.phonicsRules && (
                          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">
                            {level.phonicsRules[0].name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">{level.sentence}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(level.id);
                      }}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}

              {levels.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <i className="fa-solid fa-inbox text-4xl mb-3"></i>
                  <p>레벨이 없습니다. 새 레벨을 추가하세요!</p>
                </div>
              )}
            </div>
          </div>

          {/* Edit Form */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-700 mb-4">
              <i className="fa-solid fa-edit mr-2 text-orange-400"></i>
              {editingLevel ? '레벨 수정' : isCreating ? '새 레벨 만들기' : '레벨 선택'}
            </h2>

            {(editingLevel || isCreating) ? (
              <div className="space-y-4">
                {/* Sentence */}
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">
                    문장 <span className="text-gray-400 font-normal">(빈칸은 ____ 로 표시)</span>
                  </label>
                  <input
                    type="text"
                    value={sentence}
                    onChange={(e) => setSentence(e.target.value)}
                    placeholder="예: There is a ____."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none transition"
                  />
                </div>

                {/* Target Word */}
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">정답 단어</label>
                  <input
                    type="text"
                    value={targetWord}
                    onChange={(e) => setTargetWord(e.target.value)}
                    placeholder="예: monkey"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none transition"
                  />
                  {targetWord && (
                    <div className="mt-2 flex gap-1">
                      {targetWord.split('').map((char, idx) => (
                        <span
                          key={idx}
                          className="w-8 h-8 flex items-center justify-center bg-orange-100 text-orange-600 font-fredoka rounded"
                        >
                          {char}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Image Generation Section */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-100">
                  <label className="block text-sm font-bold text-purple-700 mb-2">
                    <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>
                    AI 이미지 생성
                  </label>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder={`이미지 설명 (예: a cute cartoon ${targetWord || 'animal'})`}
                      className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-400 focus:outline-none transition bg-white"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGenerateImage(true)}
                        disabled={isGenerating}
                        className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGenerating ? (
                          <>
                            <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                            생성 중...
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>
                            AI 생성
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleGenerateImage(false)}
                        disabled={isGenerating}
                        className="px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-sm transition border-2 border-gray-200 disabled:opacity-50"
                      >
                        <i className="fa-solid fa-magnifying-glass mr-1"></i>
                        검색
                      </button>
                    </div>
                    {generationError && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <i className="fa-solid fa-circle-exclamation"></i>
                        {generationError}
                      </p>
                    )}
                    <p className="text-xs text-purple-400">
                      프롬프트 미입력 시 정답 단어로 이미지를 생성합니다
                    </p>
                  </div>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">
                    이미지 URL <span className="text-gray-400 font-normal">(직접 입력 가능)</span>
                  </label>
                  <input
                    type="text"
                    value={imageHint}
                    onChange={(e) => setImageHint(e.target.value)}
                    placeholder="https://... 또는 위에서 AI로 생성"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none transition"
                  />
                  {imageHint && (
                    <div className="mt-2">
                      <img
                        src={imageHint}
                        alt="Preview"
                        className="w-32 h-32 rounded-xl object-cover border-2 border-gray-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=Error';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Distractors */}
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">
                    오답 글자 <span className="text-gray-400 font-normal">(쉼표로 구분)</span>
                  </label>
                  <input
                    type="text"
                    value={distractors}
                    onChange={(e) => setDistractors(e.target.value)}
                    placeholder="예: n, e, x"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none transition"
                  />
                </div>

                {/* Phonics Rule */}
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">파닉스 규칙 (선택)</label>
                  <select
                    value={selectedPhonics}
                    onChange={(e) => setSelectedPhonics(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none transition"
                  >
                    <option value="">선택 안 함</option>
                    {PHONICS_PRESETS.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {selectedPhonics && (
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1">
                      강조할 글자 인덱스 <span className="text-gray-400 font-normal">(0부터 시작, 쉼표 구분)</span>
                    </label>
                    <input
                      type="text"
                      value={phonicsIndices}
                      onChange={(e) => setPhonicsIndices(e.target.value)}
                      placeholder="예: 0, 2"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none transition"
                    />
                    {targetWord && (
                      <p className="text-xs text-gray-400 mt-1">
                        글자 위치: {targetWord.split('').map((c, i) => `${c}(${i})`).join(', ')}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition"
                  >
                    <i className="fa-solid fa-save mr-2"></i>
                    {editingLevel ? '수정 저장' : '레벨 추가'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold transition"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <i className="fa-solid fa-mouse-pointer text-4xl mb-3"></i>
                <p>왼쪽에서 레벨을 선택하거나<br />새 레벨을 추가하세요</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminScreen;
