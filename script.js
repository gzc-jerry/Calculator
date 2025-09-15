(() => {
  const displayEl = document.getElementById('display');
  const historyEl = document.getElementById('history');
  const keysEl = document.getElementById('keys');
  const tapeEl = document.getElementById('tape');
  const tapeListEl = document.getElementById('tapeList');
  const tapeClearEl = document.getElementById('tapeClear');
  const historyToggleEl = document.getElementById('historyToggle');

  const MAX_LENGTH = 14;

  const formatNumber = (value) => {
    if (!isFinite(value)) return '∞';
    if (Math.abs(value) > 999999999999 || (Math.abs(value) !== 0 && Math.abs(value) < 0.0000000001)) {
      return value.toExponential(6).replace('+', '');
    }
    const str = value.toFixed(12).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
    const [intPart, decPart] = str.split('.');
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decPart ? `${withCommas}.${decPart}` : withCommas;
  };

  const clampLength = (str) => {
    if (str.replace(/[-.,]/g, '').length <= MAX_LENGTH) return str;
    return Number(str).toExponential(6).replace('+', '');
  };

  const precise = (num) => Number(Number(num).toPrecision(15));

  const operate = (a, b, op) => {
    const x = precise(a);
    const y = precise(b);
    switch (op) {
      case '+': return precise(x + y);
      case '-': return precise(x - y);
      case '*': return precise(x * y);
      case '/': return y === 0 ? NaN : precise(x / y);
      default: return y;
    }
  };

  const state = {
    current: '0',
    previous: null,
    operator: null,
    overwrite: false,
    memory: 0,
    tape: [],
  };

  const updateDisplay = () => {
    const value = clampLength(formatNumber(Number(state.current)));
    displayEl.textContent = value;
    const hist = [];
    if (state.previous != null && state.operator) hist.push(formatNumber(Number(state.previous)), state.operator);
    historyEl.textContent = hist.join(' ');
  };

  const inputDigit = (digit) => {
    if (state.overwrite) {
      state.current = digit;
      state.overwrite = false;
    } else if (state.current === '0') {
      state.current = digit;
    } else if (state.current.replace('-', '').replace('.', '').length < MAX_LENGTH) {
      state.current += digit;
    }
  };

  const inputDot = () => {
    if (state.overwrite) {
      state.current = '0.';
      state.overwrite = false;
      return;
    }
    if (!state.current.includes('.')) state.current += '.';
  };

  const setOperator = (op) => {
    if (state.operator && state.previous != null && !state.overwrite) {
      const result = operate(Number(state.previous), Number(state.current), state.operator);
      state.previous = isNaN(result) ? null : String(result);
      state.current = isNaN(result) ? 'Not a number' : String(result);
      if (!isNaN(result)) addToTape(`${formatNumber(Number(state.previous))} ${state.operator} ${formatNumber(Number(state.current))} = ${formatNumber(result)}`);
    } else {
      state.previous = state.current;
    }
    state.operator = op;
    state.overwrite = true;
  };

  const clearAll = () => {
    state.current = '0';
    state.previous = null;
    state.operator = null;
    state.overwrite = false;
  };

  const clearEntry = () => {
    state.current = '0';
    state.overwrite = false;
  };

  const toggleSign = () => {
    if (state.current === '0') return;
    state.current = state.current.startsWith('-') ? state.current.slice(1) : '-' + state.current;
  };

  const percent = () => {
    const value = Number(state.current);
    state.current = String(precise(value / 100));
  };

  const backspace = () => {
    if (state.overwrite) return;
    if (state.current.length <= 1 || (state.current.length === 2 && state.current.startsWith('-'))) {
      state.current = '0';
      return;
    }
    state.current = state.current.slice(0, -1);
  };

  const equals = () => {
    if (state.operator == null || state.previous == null) return;
    const a = Number(state.previous);
    const b = Number(state.current);
    const op = state.operator;
    const result = operate(a, b, op);
    if (!isNaN(result)) addToTape(`${formatNumber(a)} ${op} ${formatNumber(b)} = ${formatNumber(result)}`);
    state.current = isNaN(result) ? 'Not a number' : String(result);
    state.previous = null;
    state.operator = null;
    state.overwrite = true;
  };

  const sqrt = () => {
    const value = Number(state.current);
    if (value < 0) { state.current = 'Not a number'; state.overwrite = true; return; }
    const result = precise(Math.sqrt(value));
    addToTape(`√(${formatNumber(value)}) = ${formatNumber(result)}`);
    state.current = String(result);
    state.overwrite = true;
  };

  const square = () => {
    const value = Number(state.current);
    const result = precise(value * value);
    addToTape(`(${formatNumber(value)})² = ${formatNumber(result)}`);
    state.current = String(result);
    state.overwrite = true;
  };

  const memoryClear = () => { state.memory = 0; };
  const memoryRecall = () => { state.current = String(state.memory); state.overwrite = true; };
  const memoryAdd = () => { state.memory = precise(state.memory + Number(state.current)); };
  const memorySubtract = () => { state.memory = precise(state.memory - Number(state.current)); };

  const addToTape = (entry) => {
    state.tape.push(entry);
    const li = document.createElement('li');
    li.textContent = entry;
    tapeListEl.appendChild(li);
    tapeListEl.scrollTop = tapeListEl.scrollHeight;
  };

  const clearTape = () => {
    state.tape = [];
    tapeListEl.innerHTML = '';
  };

  keysEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const action = btn.getAttribute('data-action');

    switch (action) {
      case 'digit':
        inputDigit(btn.getAttribute('data-digit'));
        break;
      case 'dot':
        inputDot();
        break;
      case 'ce':
        clearEntry();
        break;
      case 'operator':
        setOperator(btn.getAttribute('data-operator'));
        break;
      case 'equals':
        equals();
        break;
      case 'clear':
        clearAll();
        break;
      case 'sign':
        toggleSign();
        break;
      case 'percent':
        percent();
        break;
      case 'sqrt':
        sqrt();
        break;
      case 'square':
        square();
        break;
      case 'mc':
        memoryClear();
        break;
      case 'mr':
        memoryRecall();
        break;
      case 'mplus':
        memoryAdd();
        break;
      case 'mminus':
        memorySubtract();
        break;
      default:
        break;
    }
    updateDisplay();
  });

  const keyMap = {
    '+': () => setOperator('+'),
    '-': () => setOperator('-'),
    '*': () => setOperator('*'),
    '/': () => setOperator('/'),
    'Enter': () => equals(),
    '=': () => equals(),
    'Backspace': () => backspace(),
    'Escape': () => clearAll(),
    '%': () => percent(),
    '.': () => inputDot(),
    'r': () => sqrt(),
    's': () => square(),
  };

  window.addEventListener('keydown', (e) => {
    if (/^\d$/.test(e.key)) {
      inputDigit(e.key);
      updateDisplay();
      return;
    }
    const handler = keyMap[e.key];
    if (handler) {
      e.preventDefault();
      handler();
      updateDisplay();
    }
  });

  updateDisplay();

  historyToggleEl.addEventListener('click', () => {
    const isHidden = tapeEl.hasAttribute('hidden');
    if (isHidden) tapeEl.removeAttribute('hidden'); else tapeEl.setAttribute('hidden', '');
    const expanded = isHidden ? 'true' : 'false';
    historyToggleEl.setAttribute('aria-expanded', expanded);
  });

  tapeClearEl.addEventListener('click', clearTape);
})();


