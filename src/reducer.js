import { generateInitialEmployees } from './helpers';

const initialEmployees = generateInitialEmployees(10);

export const initialState = {
  week: 1,
  year: 1,
  totalWeeks: 1,
  paused: true,
  speed: 1,
  bank: 1_000_000,
  employees: initialEmployees,
  log: [{ week: 1, year: 1, message: 'Game started with 10 employees' }],
  yearlyExpenses: { 1: { salaries: 0 } },
  yearlyRevenue: { 1: 0 },
  currentWeekExpenses: { salaries: 0 },
  currentWeekRevenue: 0,
  gameOver: false,
  activeTab: 'dashboard',
};

export function gameReducer(state, action) {
  switch (action.type) {
    case 'TICK': {
      if (state.paused || state.gameOver) return state;

      let newWeek = state.week + 1;
      let newYear = state.year;
      if (newWeek > 52) {
        newWeek = 1;
        newYear += 1;
      }

      const activeEmployees = state.employees.filter(
        (e) => e.status === 'Active'
      );
      const weeklyPayroll = activeEmployees.reduce(
        (sum, e) => sum + e.salary / 52,
        0
      );
      const newBank = state.bank - weeklyPayroll;

      const yearExpenses = {
        ...(state.yearlyExpenses[newYear] || { salaries: 0 }),
      };
      yearExpenses.salaries += weeklyPayroll;

      const newLog = [
        {
          week: newWeek,
          year: newYear,
          message: `Payroll processed — CR ${Math.round(weeklyPayroll).toLocaleString('en-US')} debited`,
        },
        ...state.log,
      ].slice(0, 200);

      const gameOver = newBank <= 0;
      if (gameOver) {
        newLog.unshift({
          week: newWeek,
          year: newYear,
          message: 'GAME OVER — Startup ran out of money!',
        });
      }

      return {
        ...state,
        week: newWeek,
        year: newYear,
        totalWeeks: state.totalWeeks + 1,
        bank: newBank,
        yearlyExpenses: { ...state.yearlyExpenses, [newYear]: yearExpenses },
        yearlyRevenue: {
          ...state.yearlyRevenue,
          [newYear]: state.yearlyRevenue[newYear] || 0,
        },
        currentWeekExpenses: { salaries: weeklyPayroll },
        currentWeekRevenue: 0,
        log: newLog,
        gameOver,
        paused: gameOver ? true : state.paused,
      };
    }
    case 'TOGGLE_PAUSE':
      return { ...state, paused: !state.paused };
    case 'SET_SPEED':
      return { ...state, speed: action.speed };
    case 'SET_TAB':
      return { ...state, activeTab: action.tab };
    default:
      return state;
  }
}
