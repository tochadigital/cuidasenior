
import React, { useState, useMemo, useEffect } from 'react';
import { AppState, MealLog, RoutineTask, Recipe, MemoryCard } from '../types';

interface Props {
  state: AppState;
  updateState: (s: Partial<AppState>) => void;
  showAlert: (title: string, msg: string) => void;
}

// Cardápios Rotativos (Econômicos e Detalhados)
const RECIPES_WEEK_A: Recipe[] = [
  { 
    day: 'seg', 
    title: 'Picadinho de Carne com Batata e Cenoura', 
    ingredients: ['300g de acém ou músculo em cubos pequenos', '2 batatas médias picadas', '1 cenoura em rodelas', 'Cebola e alho picados', 'Cheiro-verde a gosto'], 
    instructions: '1. Refogue a cebola e o alho em um fio de óleo.\n2. Adicione a carne e deixe dourar bem.\n3. Cubra com água e cozinhe na pressão por 20 min.\n4. Abra, adicione as batatas e cenouras.\n5. Cozinhe sem pressão até os legumes ficarem macios e o caldo engrossar.\n6. Finalize com cheiro-verde.', 
    benefits: 'Carne de panela fica macia para mastigar e os legumes fornecem vitaminas essenciais.' 
  },
  { 
    day: 'ter', 
    title: 'Omelete de Forno com Legumes (Sobras)', 
    ingredients: ['3 ovos', 'Sobras de legumes cozidos (chuchu, abobrinha)', '1 colher de farinha de trigo (ou aveia)', '1 pitada de fermento', 'Orégano'], 
    instructions: '1. Bata os ovos com um garfo.\n2. Misture os legumes picadinhos, a farinha e o tempero.\n3. Por último, misture o fermento levemente.\n4. Unte uma forma pequena com óleo.\n5. Despeje a mistura e asse em forno médio por cerca de 20 minutos ou até dourar.', 
    benefits: 'Refeição leve, econômica e evita desperdício. Ovos são ótimas fontes de proteína.' 
  },
  { 
    day: 'qua', 
    title: 'Macarrão com Sardinha e Molho de Tomate', 
    ingredients: ['250g de macarrão (parafuso ou penne)', '1 lata de sardinha (limpa, sem espinha)', '1 sachê de molho de tomate', 'Cebola picadinha'], 
    instructions: '1. Cozinhe o macarrão em água fervente até ficar macio.\n2. Enquanto isso, refogue a cebola.\n3. Adicione o molho de tomate e deixe ferver um pouco.\n4. Acrescente a sardinha amassada com o garfo.\n5. Misture o molho ao macarrão escorrido e sirva.', 
    benefits: 'Sardinha é rica em Ômega-3 e cálcio, muito mais barata que peixes frescos.' 
  },
  { 
    day: 'qui', 
    title: 'Frango Desfiado com Purê de Batata', 
    ingredients: ['1 peito de frango cozido e desfiado', 'Milho ou ervilha (opcional)', '4 batatas médias', 'Meio copo de leite', '1 colher de margarina ou manteiga'], 
    instructions: '1. Para o frango: Refogue o frango desfiado com alho, cebola e tomate picado para ficar molhadinho.\n2. Para o purê: Cozinhe as batatas até desmanchar.\n3. Amasse as batatas quente.\n4. Misture a margarina e o leite até ficar um creme liso.\n5. Sirva o purê com o frango por cima.', 
    benefits: 'Fácil de engolir e digerir. O frango garante a manutenção muscular.' 
  },
  { 
    day: 'sex', 
    title: 'Arroz de Forno Simples', 
    ingredients: ['2 xícaras de arroz cozido', '1 cenoura ralada', '1 ovo cozido picado', 'Fatias de queijo ou requeijão', 'Cheiro-verde'], 
    instructions: '1. Em uma travessa, misture o arroz com a cenoura ralada, o ovo picado e o cheiro-verde.\n2. Se tiver, pode misturar um pouco de requeijão ou molho de tomate para umedecer.\n3. Cubra com as fatias de queijo.\n4. Leve ao forno apenas para derreter o queijo (uns 10 minutos).', 
    benefits: 'Transforma o arroz do dia a dia em um prato completo e diferente.' 
  },
  { 
    day: 'sab', 
    title: 'Sopa de Fubá com Couve e Ovos', 
    ingredients: ['1 xícara de fubá', '1 maço de couve picada bem fininha', '2 ovos', 'Alho e caldo de carne/legumes caseiro'], 
    instructions: '1. Refogue o alho.\n2. Dissolva o fubá em um copo de água fria e despeje na panela com mais água quente.\n3. Mexa sem parar até engrossar e cozinhar (uns 15 min).\n4. Quebre os ovos dentro do caldo quente para cozinhar inteiros.\n5. Desligue o fogo e misture a couve (ela cozinha no calor da sopa).', 
    benefits: 'Alimento que sustenta, aquece e a couve é rica em cálcio e ferro.' 
  },
  { 
    day: 'dom', 
    title: 'Carne Moída com Abóbora', 
    ingredients: ['300g de carne moída', 'Meia abóbora cabotiá (ou moranga) em cubos', 'Cebola, alho', 'Salsinha'], 
    instructions: '1. Refogue a carne moída até ficar soltinha e marrom.\n2. Tempere com sal, alho e cebola.\n3. Adicione os cubos de abóbora e um pouquinho de água (meio copo).\n4. Tampe a panela e deixe cozinhar em fogo baixo até a abóbora amolecer.\n5. Salpique salsinha antes de servir.', 
    benefits: 'A abóbora é adocicada, agrada o paladar e é rica em fibras.' 
  },
];

const RECIPES_WEEK_B: Recipe[] = [
  { 
    day: 'seg', 
    title: 'Ensopado de Frango com Batata', 
    ingredients: ['Coxa ou sobrecoxa de frango (sem pele)', '3 batatas em cubos', 'Colorau ou açafrão', 'Tomate picado'], 
    instructions: '1. Tempere o frango com limão e sal.\n2. Refogue o frango com um pouco de óleo e colorau para dar cor.\n3. Adicione o tomate e um pouco de água.\n4. Quando o frango estiver quase cozido, junte as batatas.\n5. Deixe cozinhar até o caldo engrossar e a batata amaciar.', 
    benefits: 'Proteína suculenta e fácil preparo. O açafrão é anti-inflamatório.' 
  },
  { 
    day: 'ter', 
    title: 'Arroz com Lentilha (Mjadra Simples)', 
    ingredients: ['1 xícara de lentilha', '1 xícara de arroz', '2 cebolas grandes em rodelas', 'Azeite ou óleo'], 
    instructions: '1. Cozinhe a lentilha em água até ficar "al dente" (não muito mole).\n2. Na mesma panela, adicione o arroz e cozinhe juntos até secar a água.\n3. À parte, frite as rodelas de cebola no óleo até ficarem bem escuras e crocantes.\n4. Misture a cebola no arroz com lentilha.', 
    benefits: 'Combinação perfeita de proteínas vegetais e muito saborosa.' 
  },
  { 
    day: 'qua', 
    title: 'Polenta Mole com Molho de Carne', 
    ingredients: ['1 xícara de fubá', '200g de carne moída', 'Molho de tomate', 'Alho e sal'], 
    instructions: '1. Faça o molho: refogue a carne moída e adicione o molho de tomate. Reserve.\n2. Faça a polenta: Refogue alho, adicione água e o fubá dissolvido.\n3. Mexa até cozinhar bem e ficar cremoso (aprox. 20 min).\n4. Sirva a polenta no prato e cubra com o molho de carne.', 
    benefits: 'Prato reconfortante, fácil de engolir para quem tem dificuldade de mastigação.' 
  },
  { 
    day: 'qui', 
    title: 'Torta de Liquidificador de Legumes', 
    ingredients: ['2 ovos', '1 xícara de leite', '1 xícara de farinha', 'Meia xícara de óleo', 'Legumes variados picados (cenoura, ervilha, milho)'], 
    instructions: '1. Bata no liquidificador: ovos, leite, óleo e farinha (com sal e fermento).\n2. Em uma tigela, misture a massa batida com os legumes picados.\n3. Despeje em forma untada.\n4. Asse em forno médio por 30-35 minutos até dourar.', 
    benefits: 'Lanche ou jantar prático para aproveitar os vegetais da geladeira.' 
  },
  { 
    day: 'sex', 
    title: 'Peixe (Filé de Merluza) Assado com Batatas', 
    ingredients: ['Filé de merluza ou pescada', 'Batatas em rodelas', 'Tomate e cebola em rodelas', 'Azeite'], 
    instructions: '1. Tempere o peixe com limão e sal.\n2. Em uma assadeira, faça uma "cama" com as rodelas de batata cruas.\n3. Coloque o peixe por cima.\n4. Cubra com cebola e tomate.\n5. Regue com azeite e leve ao forno coberto com papel alumínio por 30 min. Retire o papel e deixe mais 10 min.', 
    benefits: 'Peixe barato, saudável e feito no forno não faz sujeira.' 
  },
  { 
    day: 'sab', 
    title: 'Panqueca Simples de Carne', 
    ingredients: ['1 copo de leite', '1 copo de farinha', '1 ovo', 'Carne moída refogada para recheio'], 
    instructions: '1. Bata leite, farinha e ovo no liquidificador.\n2. Aqueça uma frigideira untada e faça os discos de massa fininhos.\n3. Recheie com a carne moída e enrole.\n4. Coloque numa travessa, jogue um pouco de molho por cima e sirva.', 
    benefits: 'Visual atrativo e textura macia.' 
  },
  { 
    day: 'dom', 
    title: 'Galinhada Caipira (Arroz com Frango)', 
    ingredients: ['Pedaços de frango (coxinha da asa ou peito)', '2 xícaras de arroz', 'Açafrão', 'Milho verde'], 
    instructions: '1. Frite o frango temperado na panela até dourar bem.\n2. Adicione a cebola, alho e o açafrão.\n3. Jogue o arroz cru e refogue junto.\n4. Cubra com água quente e cozinhe tudo na mesma panela.\n5. Quando secar, adicione o milho e cheiro-verde.', 
    benefits: 'Prato único, sustenta a família toda e muito saboroso.' 
  },
];

const WEEKDAYS = [
  { id: 'seg', label: 'SEG' },
  { id: 'ter', label: 'TER' },
  { id: 'qua', label: 'QUA' },
  { id: 'qui', label: 'QUI' },
  { id: 'sex', label: 'SEX' },
  { id: 'sab', label: 'SAB' },
  { id: 'dom', label: 'DOM' },
];

const GAME_ICONS = [
  'fa-cat', 'fa-dog', 'fa-dove', 'fa-fish', 'fa-horse', 'fa-frog'
];

// SUDOKU HELPERS
const BLANK = 0;
const isValidSudokuMove = (grid: number[], row: number, col: number, num: number) => {
  // Check Row
  for (let x = 0; x < 9; x++) {
    if (grid[row * 9 + x] === num) return false;
  }
  // Check Col
  for (let x = 0; x < 9; x++) {
    if (grid[x * 9 + col] === num) return false;
  }
  // Check 3x3 Box
  const startRow = row - row % 3, startCol = col - col % 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[(i + startRow) * 9 + (j + startCol)] === num) return false;
    }
  }
  return true;
};

const solveSudoku = (grid: number[]): boolean => {
  for (let i = 0; i < 81; i++) {
    if (grid[i] === BLANK) {
      const row = Math.floor(i / 9);
      const col = i % 9;
      for (let num = 1; num <= 9; num++) {
        if (isValidSudokuMove(grid, row, col, num)) {
          grid[i] = num;
          if (solveSudoku(grid)) return true;
          grid[i] = BLANK;
        }
      }
      return false;
    }
  }
  return true;
};

const generateSudoku = () => {
  const grid = Array(81).fill(BLANK);
  // Fill diagonal 3x3 boxes (independent)
  for (let i = 0; i < 9; i = i + 3) {
    const boxRow = i, boxCol = i;
    const nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
    let k = 0;
    for(let r = 0; r < 3; r++) {
      for(let c = 0; c < 3; c++) {
        grid[(boxRow + r) * 9 + (boxCol + c)] = nums[k];
        k++;
      }
    }
  }
  // Solve the rest
  solveSudoku(grid);
  // Remove elements to make puzzle
  const attempts = 40; 
  for (let i = 0; i < attempts; i++) {
    let idx = Math.floor(Math.random() * 81);
    while(grid[idx] === 0) idx = Math.floor(Math.random() * 81);
    grid[idx] = BLANK;
  }
  return grid;
};

export const DailyView: React.FC<Props> = ({ state, updateState, showAlert }) => {
  const [section, setSection] = useState<'routine' | 'meals' | 'recipes' | 'jogos'>('routine');
  const [mealDesc, setMealDesc] = useState('');
  const [mealType, setMealType] = useState<MealLog['type']>('Breakfast');
  
  // Recipe State
  const [selectedDay, setSelectedDay] = useState('seg');

  // Games State
  const [activeGame, setActiveGame] = useState<'memory' | 'sudoku' | 'genius'>('memory');

  // Memory Game State
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [moves, setMoves] = useState(0);
  const [lockBoard, setLockBoard] = useState(false);

  // Sudoku State
  const [sudokuGrid, setSudokuGrid] = useState<number[]>(Array(81).fill(0));
  const [sudokuInitial, setSudokuInitial] = useState<boolean[]>(Array(81).fill(false));
  const [selectedCell, setSelectedCell] = useState<number | null>(null);

  // Genius State
  const [geniusSequence, setGeniusSequence] = useState<string[]>([]);
  const [isGeniusTurn, setIsGeniusTurn] = useState(false);
  const [geniusFlash, setGeniusFlash] = useState<string | null>(null);
  const [geniusScore, setGeniusScore] = useState(0);
  const [geniusGameOver, setGeniusGameOver] = useState(false);
  const [geniusStarted, setGeniusStarted] = useState(false);
  const [playerStep, setPlayerStep] = useState(0);

  // Determine which recipe set to use based on the current week number
  const currentRecipes = useMemo(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil(days / 7);
    
    // Even weeks = Set A, Odd weeks = Set B (Rotates every 7 days)
    return weekNumber % 2 === 0 ? RECIPES_WEEK_A : RECIPES_WEEK_B;
  }, []);

  const activeRecipe = currentRecipes.find(r => r.day === selectedDay);

  // Auto-select current day on mount
  React.useEffect(() => {
    const dayMap = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    const today = dayMap[new Date().getDay()];
    setSelectedDay(today);
  }, []);

  // Initialize Memory Game
  const initializeMemory = () => {
    const duplicatedIcons = [...GAME_ICONS, ...GAME_ICONS];
    const shuffled = duplicatedIcons.sort(() => Math.random() - 0.5);
    const newCards = shuffled.map((icon, index) => ({
      id: index,
      icon,
      isFlipped: false,
      isMatched: false
    }));
    setCards(newCards);
    setMoves(0);
    setLockBoard(false);
  };

  // Initialize Sudoku
  const initializeSudoku = () => {
    const newPuzzle = generateSudoku();
    setSudokuGrid([...newPuzzle]);
    setSudokuInitial(newPuzzle.map(n => n !== 0));
    setSelectedCell(null);
  };

  useEffect(() => {
    if (section === 'jogos') {
      if (activeGame === 'memory') initializeMemory();
      if (activeGame === 'sudoku') initializeSudoku();
      if (activeGame === 'genius') {
        setGeniusStarted(false);
        setGeniusSequence([]);
        setGeniusScore(0);
        setGeniusGameOver(false);
      }
    }
  }, [section, activeGame]);

  // Memory Game Logic
  const handleCardClick = (id: number) => {
    if (lockBoard) return;
    const clickedCard = cards.find(c => c.id === id);
    if (!clickedCard || clickedCard.isFlipped || clickedCard.isMatched) return;

    const updatedCards = cards.map(c => c.id === id ? { ...c, isFlipped: true } : c);
    setCards(updatedCards);

    const flipped = updatedCards.filter(c => c.isFlipped && !c.isMatched);
    
    if (flipped.length === 2) {
      setMoves(prev => prev + 1);
      setLockBoard(true);
      
      if (flipped[0].icon === flipped[1].icon) {
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.icon === flipped[0].icon ? { ...c, isMatched: true } : c
          ));
          setLockBoard(false);
        }, 500);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            !c.isMatched ? { ...c, isFlipped: false } : c
          ));
          setLockBoard(false);
        }, 1000);
      }
    }
  };

  // Sudoku Input Logic
  const handleSudokuInput = (num: number) => {
    if (selectedCell === null) return;
    if (sudokuInitial[selectedCell]) return; // Locked cell

    const newGrid = [...sudokuGrid];
    newGrid[selectedCell] = num;
    setSudokuGrid(newGrid);
  };

  // Genius Logic
  const playGeniusSequence = async (sequence: string[]) => {
    setIsGeniusTurn(true);
    await new Promise(r => setTimeout(r, 800));
    for (const color of sequence) {
      setGeniusFlash(color);
      await new Promise(r => setTimeout(r, 400));
      setGeniusFlash(null);
      await new Promise(r => setTimeout(r, 200));
    }
    setIsGeniusTurn(false);
  };

  const startGenius = () => {
    const colors = ['green', 'red', 'yellow', 'blue'];
    const firstColor = colors[Math.floor(Math.random() * 4)];
    const newSeq = [firstColor];
    setGeniusSequence(newSeq);
    setGeniusScore(0);
    setGeniusGameOver(false);
    setGeniusStarted(true);
    setPlayerStep(0);
    playGeniusSequence(newSeq);
  };

  const handleGeniusClick = (color: string) => {
    if (!geniusStarted || isGeniusTurn || geniusGameOver) return;

    setGeniusFlash(color);
    setTimeout(() => setGeniusFlash(null), 200);

    if (color === geniusSequence[playerStep]) {
      if (playerStep === geniusSequence.length - 1) {
        setGeniusScore(prev => prev + 1);
        setPlayerStep(0);
        setIsGeniusTurn(true);
        
        const colors = ['green', 'red', 'yellow', 'blue'];
        const nextColor = colors[Math.floor(Math.random() * 4)];
        const newSeq = [...geniusSequence, nextColor];
        setGeniusSequence(newSeq);
        
        playGeniusSequence(newSeq);
      } else {
        setPlayerStep(prev => prev + 1);
      }
    } else {
      setGeniusGameOver(true);
      setGeniusStarted(false);
    }
  };

  const getGeniusColorClass = (color: string, isActive: boolean) => {
      switch(color) {
          case 'green': return isActive ? 'bg-green-300 shadow-[0_0_25px_#86efac] scale-105' : 'bg-green-600';
          case 'red': return isActive ? 'bg-red-300 shadow-[0_0_25px_#fca5a5] scale-105' : 'bg-red-600';
          case 'yellow': return isActive ? 'bg-yellow-200 shadow-[0_0_25px_#fef08a] scale-105' : 'bg-yellow-500';
          case 'blue': return isActive ? 'bg-blue-300 shadow-[0_0_25px_#93c5fd] scale-105' : 'bg-blue-600';
          default: return 'bg-gray-200';
      }
  };

  const toggleRoutine = (id: string) => {
    const updated = state.routine.map(r => r.id === id ? { ...r, completed: !r.completed } : r);
    updateState({ routine: updated });
  };

  const addMeal = () => {
    if (!mealDesc) return;
    const newMeal: MealLog = {
      id: Date.now().toString(),
      type: mealType,
      description: mealDesc,
      date: new Date().toISOString()
    };
    updateState({ meals: [newMeal, ...state.meals] });
    setMealDesc('');
  };

  // Add default routines if empty
  React.useEffect(() => {
    if (state.routine.length === 0) {
      const defaults: RoutineTask[] = [
        { id: 'r1', type: 'Physical', description: 'Caminhada Matinal (15 min)', completed: false, date: new Date().toISOString() },
        { id: 'r2', type: 'Memory', description: 'Jogo da Memória / Palavras Cruzadas', completed: false, date: new Date().toISOString() },
        { id: 'r3', type: 'Physio', description: 'Alongamento de Pernas', completed: false, date: new Date().toISOString() }
      ];
      updateState({ routine: defaults });
    }
  }, []);

  const mealLabels: Record<string, string> = { Breakfast: 'Café', Lunch: 'Almoço', Snack: 'Lanche', Dinner: 'Jantar' };
  const taskTypeLabels: Record<string, string> = { Physical: 'Físico', Cognitive: 'Cognitivo', Memory: 'Memória', Physio: 'Fisio', Other: 'Outro' };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header / Tab Nav */}
      <div className="bg-white shadow-sm p-4 pr-16 sticky top-0 z-10">
        <div className="flex p-1 bg-gray-100 rounded-lg">
          <button 
            onClick={() => setSection('routine')}
            className={`flex-1 py-2 px-1 rounded-md text-[10px] font-bold uppercase transition-all whitespace-nowrap ${section === 'routine' ? 'bg-white shadow text-teal-600' : 'text-gray-500'}`}
          >
            Rotina
          </button>
          <button 
            onClick={() => setSection('meals')}
            className={`flex-1 py-2 px-1 rounded-md text-[10px] font-bold uppercase transition-all whitespace-nowrap ${section === 'meals' ? 'bg-white shadow text-teal-600' : 'text-gray-500'}`}
          >
            Refeições
          </button>
          <button 
            onClick={() => setSection('recipes')}
            className={`flex-1 py-2 px-1 rounded-md text-[10px] font-bold uppercase transition-all whitespace-nowrap ${section === 'recipes' ? 'bg-white shadow text-teal-600' : 'text-gray-500'}`}
          >
            Receitas
          </button>
          <button 
            onClick={() => setSection('jogos')}
            className={`flex-1 py-2 px-1 rounded-md text-[10px] font-bold uppercase transition-all whitespace-nowrap ${section === 'jogos' ? 'bg-white shadow text-teal-600' : 'text-gray-500'}`}
          >
            Jogos
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto flex-1 pb-6">
        {section === 'routine' && (
          <div className="space-y-3">
            {state.routine.map(task => (
              <div key={task.id} onClick={() => toggleRoutine(task.id)} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${task.completed ? 'border-teal-500 bg-teal-50' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${task.completed ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <i className={`fas ${task.type === 'Physical' ? 'fa-walking' : task.type === 'Memory' ? 'fa-brain' : 'fa-hands-helping'}`}></i>
                  </div>
                  <div>
                    <h3 className={`font-bold ${task.completed ? 'text-teal-900' : 'text-gray-800'}`}>{task.description}</h3>
                    <p className="text-xs text-gray-500">{taskTypeLabels[task.type] || task.type}</p>
                  </div>
                </div>
                {task.completed && <i className="fas fa-check-circle text-teal-500 text-xl"></i>}
              </div>
            ))}
          </div>
        )}

        {section === 'meals' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3">Registrar Refeição</h3>
              <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                {['Breakfast', 'Lunch', 'Snack', 'Dinner'].map(t => (
                  <button key={t} onClick={() => setMealType(t as any)} className={`px-3 py-1 rounded-lg text-xs font-bold ${mealType === t ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-gray-50 border border-gray-200'}`}>
                    {mealLabels[t]}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={mealDesc} 
                  onChange={e => setMealDesc(e.target.value)} 
                  placeholder="O que foi servido?" 
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 outline-none focus:border-teal-500"
                />
                <button onClick={addMeal} className="bg-teal-600 text-white h-10 w-10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-plus"></i>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {state.meals.map(meal => (
                <div key={meal.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-orange-400">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">{mealLabels[meal.type] || meal.type}</span>
                      <div className="mt-1">
                         <p className="text-gray-400 text-[10px] font-bold mb-0.5">
                           {new Date(meal.date).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}
                         </p>
                         <p className="text-gray-800 font-medium">{meal.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-500">{new Date(meal.date).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'recipes' && (
          <div className="space-y-4">
             <div className="flex justify-between items-center bg-white p-2 rounded-xl shadow-sm">
                {WEEKDAYS.map(day => (
                  <button 
                    key={day.id}
                    onClick={() => setSelectedDay(day.id)}
                    className={`w-10 h-10 rounded-full text-[10px] font-bold flex items-center justify-center transition-all ${selectedDay === day.id ? 'bg-green-500 text-white shadow-md scale-110' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                  >
                    {day.label}
                  </button>
                ))}
             </div>

             {activeRecipe ? (
               <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 animate-fade-in">
                  <div className="bg-green-50 p-4 border-b border-green-100">
                     <div className="flex items-start gap-3">
                       <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 shrink-0">
                         <i className="fas fa-utensils text-xl"></i>
                       </div>
                       <div>
                         <h3 className="font-bold text-gray-800 text-lg leading-tight">{activeRecipe.title}</h3>
                         <p className="text-green-600 text-xs font-bold mt-1 flex items-center gap-1">
                           <i className="fas fa-heartbeat"></i> {activeRecipe.benefits}
                         </p>
                       </div>
                     </div>
                  </div>
                  <div className="p-5 space-y-4">
                     <div>
                       <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ingredientes</h4>
                       <ul className="space-y-2">
                         {activeRecipe.ingredients.map((ing, idx) => (
                           <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                             <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 shrink-0"></span>
                             {ing}
                           </li>
                         ))}
                       </ul>
                     </div>
                     <div>
                       <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Modo de Preparo</h4>
                       <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg whitespace-pre-line">
                         {activeRecipe.instructions}
                       </div>
                     </div>
                  </div>
               </div>
             ) : (
               <div className="text-center text-gray-400 py-10">
                 <i className="fas fa-carrot text-4xl mb-2 opacity-50"></i>
                 <p>Nenhuma receita encontrada para este dia.</p>
               </div>
             )}
             
             <div className="text-center">
                <p className="text-[10px] text-gray-400 bg-gray-100 inline-block px-3 py-1 rounded-full">
                  Cardápio Semana {new Date().getDate() % 2 === 0 ? 'A' : 'B'} (Rotativo)
                </p>
             </div>
          </div>
        )}

        {section === 'jogos' && (
          <div className="space-y-4">
             <div className="flex bg-gray-200 rounded-lg p-1 mb-2">
               <button 
                 onClick={() => setActiveGame('memory')}
                 className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${activeGame === 'memory' ? 'bg-white shadow text-teal-600' : 'text-gray-500'}`}
               >
                 Memória
               </button>
               <button 
                 onClick={() => setActiveGame('sudoku')}
                 className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${activeGame === 'sudoku' ? 'bg-white shadow text-teal-600' : 'text-gray-500'}`}
               >
                 Sudoku
               </button>
               <button 
                 onClick={() => setActiveGame('genius')}
                 className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${activeGame === 'genius' ? 'bg-white shadow text-teal-600' : 'text-gray-500'}`}
               >
                 Genius
               </button>
             </div>

             {activeGame === 'memory' && (
               <div className="space-y-6">
                 <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
                    <div>
                       <h3 className="font-bold text-gray-800">Jogo da Memória</h3>
                       <p className="text-xs text-gray-500">Exercite o cérebro</p>
                    </div>
                    <div className="text-right">
                       <p className="text-xs text-gray-400 uppercase font-bold">Movimentos</p>
                       <p className="text-xl font-bold text-teal-600">{moves}</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-3 gap-3">
                    {cards.map(card => (
                       <div 
                         key={card.id} 
                         onClick={() => handleCardClick(card.id)}
                         className={`aspect-square rounded-xl flex items-center justify-center text-3xl cursor-pointer transition-all duration-300 transform ${card.isFlipped || card.isMatched ? 'bg-white rotate-y-180 shadow-md border-2 border-teal-500' : 'bg-teal-500 shadow-sm hover:bg-teal-600'}`}
                       >
                          {(card.isFlipped || card.isMatched) && (
                             <i className={`fas ${card.icon} text-teal-600 animate-fade-in`}></i>
                          )}
                       </div>
                    ))}
                 </div>

                 <button 
                   onClick={initializeMemory} 
                   className="w-full py-3 bg-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-300 transition-colors"
                   >
                   <i className="fas fa-redo mr-2"></i> Reiniciar Memória
                 </button>
               </div>
             )}

             {activeGame === 'sudoku' && (
                <div className="space-y-4">
                   <div className="bg-white p-4 rounded-xl shadow-sm flex justify-center">
                      <div className="grid grid-cols-9 gap-0 border-2 border-gray-800 bg-gray-800">
                        {sudokuGrid.map((cell, i) => {
                          const row = Math.floor(i / 9);
                          const col = i % 9;
                          // Borders for 3x3 boxes
                          const borderRight = (col + 1) % 3 === 0 && col !== 8 ? 'border-r-2 border-r-gray-800' : 'border-r border-r-gray-300';
                          const borderBottom = (row + 1) % 3 === 0 && row !== 8 ? 'border-b-2 border-b-gray-800' : 'border-b border-b-gray-300';
                          
                          return (
                            <div 
                              key={i}
                              onClick={() => setSelectedCell(i)}
                              className={`w-8 h-8 flex items-center justify-center text-sm font-bold cursor-pointer bg-white ${borderRight} ${borderBottom} ${selectedCell === i ? 'bg-blue-100' : ''} ${sudokuInitial[i] ? 'text-gray-900' : 'text-teal-600'}`}
                            >
                              {cell !== 0 ? cell : ''}
                            </div>
                          );
                        })}
                      </div>
                   </div>

                   <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => handleSudokuInput(n)} className="bg-white shadow-sm py-3 rounded-lg font-bold text-gray-700 hover:bg-teal-50 active:scale-95">{n}</button>
                      ))}
                   </div>
                   <div className="grid grid-cols-5 gap-2">
                      {[6, 7, 8, 9].map(n => (
                        <button key={n} onClick={() => handleSudokuInput(n)} className="bg-white shadow-sm py-3 rounded-lg font-bold text-gray-700 hover:bg-teal-50 active:scale-95">{n}</button>
                      ))}
                      <button onClick={() => handleSudokuInput(0)} className="bg-rose-100 text-rose-600 shadow-sm py-3 rounded-lg font-bold hover:bg-rose-200 active:scale-95">
                        <i className="fas fa-eraser"></i>
                      </button>
                   </div>

                   <button 
                     onClick={initializeSudoku} 
                     className="w-full py-3 bg-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-300 transition-colors"
                   >
                     <i className="fas fa-redo mr-2"></i> Novo Jogo
                   </button>
                </div>
             )}

             {activeGame === 'genius' && (
               <div className="space-y-6 flex flex-col items-center">
                 <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm w-full">
                    <div>
                       <h3 className="font-bold text-gray-800">Genius</h3>
                       <p className="text-xs text-gray-500">Memorize a sequência</p>
                    </div>
                    <div className="text-right">
                       <p className="text-xs text-gray-400 uppercase font-bold">Pontuação</p>
                       <p className="text-xl font-bold text-teal-600">{geniusScore}</p>
                    </div>
                 </div>

                 <div className="relative">
                   <div className="grid grid-cols-2 gap-4 max-w-[300px] mx-auto">
                      {['green', 'red', 'yellow', 'blue'].map(color => (
                        <button
                          key={color}
                          className={`h-32 w-32 rounded-2xl transition-all duration-100 shadow-md
                            ${getGeniusColorClass(color, geniusFlash === color)}
                            ${isGeniusTurn ? 'cursor-not-allowed opacity-80' : 'active:scale-95'}
                          `}
                          onClick={() => handleGeniusClick(color)}
                        />
                      ))}
                   </div>
                   
                   {/* Game Over Overlay */}
                   {geniusGameOver && (
                     <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl backdrop-blur-sm animate-fade-in">
                        <div className="text-center">
                           <i className="fas fa-times-circle text-4xl text-red-500 mb-2"></i>
                           <h3 className="font-bold text-gray-800 text-lg">Fim de Jogo!</h3>
                           <p className="text-sm text-gray-600 mb-3">Pontuação: {geniusScore}</p>
                           <button onClick={startGenius} className="bg-teal-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg active:scale-95">
                             Tentar Novamente
                           </button>
                        </div>
                     </div>
                   )}
                 </div>

                 {!geniusStarted && !geniusGameOver && (
                   <button 
                     onClick={startGenius} 
                     className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl shadow-lg hover:bg-teal-700 transition-colors active:scale-95"
                   >
                     <i className="fas fa-play mr-2"></i> Iniciar Jogo
                   </button>
                 )}
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};
