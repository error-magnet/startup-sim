import { generateInitialEmployees, generateCompanyName } from './helpers';

const TOTAL_WORK = 36; // person-weeks at base (3 people x 12 weeks)

function makeInitialEpics() {
  return [
    {
      id: 'design-ui',
      name: 'Product Design & UI Development',
      productId: 'appify',
      assignedEmployeeIds: [],
      workCompleted: 0,
      totalWork: TOTAL_WORK,
      status: 'Not Started',
    },
    {
      id: 'infra-security',
      name: 'Infrastructure & Security',
      productId: 'appify',
      assignedEmployeeIds: [],
      workCompleted: 0,
      totalWork: TOTAL_WORK,
      status: 'Not Started',
    },
  ];
}

function makeInitialProducts() {
  return [
    {
      id: 'appify',
      name: 'Appify',
      type: 'SaaS',
      status: 'In Development',
    },
  ];
}

function effectiveWork(headcount) {
  if (headcount === 0) return 0;
  return Math.min(headcount, 3) + Math.max(0, headcount - 3) * 0.5;
}

function weeksRemaining(epic) {
  const remaining = epic.totalWork - epic.workCompleted;
  if (remaining <= 0) return 0;
  const eff = effectiveWork(epic.assignedEmployeeIds.length);
  if (eff === 0) return Infinity;
  return Math.ceil(remaining / eff);
}

export { effectiveWork, weeksRemaining };

const initialEmployees = generateInitialEmployees(10);
const companyName = generateCompanyName();

export const initialState = {
  week: 1,
  year: 1,
  totalWeeks: 1,
  paused: true,
  speed: 1,
  bank: 1_000_000,
  companyName: `${companyName} Inc.`,
  theme: 'dark',
  employees: initialEmployees,
  products: makeInitialProducts(),
  epics: makeInitialEpics(),
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

      // Process epics
      let newEpics = state.epics.map((epic) => {
        if (epic.status === 'Complete') return epic;
        const headcount = epic.assignedEmployeeIds.length;
        if (headcount === 0) return epic;

        const eff = effectiveWork(headcount);
        const newWorkCompleted = epic.workCompleted + eff;
        const completed = newWorkCompleted >= epic.totalWork;

        if (completed) {
          newLog.unshift({
            week: newWeek,
            year: newYear,
            message: `${epic.name} completed!`,
          });
        }

        return {
          ...epic,
          workCompleted: Math.min(newWorkCompleted, epic.totalWork),
          status: completed ? 'Complete' : 'In Progress',
        };
      });

      // Check if all epics for a product are complete
      let newProducts = state.products.map((product) => {
        if (product.status === 'Live') return product;
        const productEpics = newEpics.filter((e) => e.productId === product.id);
        const allComplete = productEpics.every((e) => e.status === 'Complete');
        if (allComplete && productEpics.length > 0) {
          newLog.unshift({
            week: newWeek,
            year: newYear,
            message: `${product.name} MVP shipped!`,
          });
          return { ...product, status: 'Live' };
        }
        return product;
      });

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
        epics: newEpics,
        products: newProducts,
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

    case 'ASSIGN_EMPLOYEE': {
      const { employeeId, epicId } = action;
      const epic = state.epics.find((e) => e.id === epicId);
      if (!epic || epic.status === 'Complete') return state;

      // Remove from any current epic
      let newEpics = state.epics.map((e) => ({
        ...e,
        assignedEmployeeIds: e.assignedEmployeeIds.filter(
          (id) => id !== employeeId
        ),
      }));
      // Add to target epic
      newEpics = newEpics.map((e) =>
        e.id === epicId
          ? {
              ...e,
              assignedEmployeeIds: [...e.assignedEmployeeIds, employeeId],
              status: e.status === 'Not Started' ? 'In Progress' : e.status,
            }
          : e
      );

      const newEmployees = state.employees.map((emp) =>
        emp.id === employeeId
          ? { ...emp, assignedEpicId: epicId }
          : emp
      );

      const emp = state.employees.find((e) => e.id === employeeId);
      const newLog = [
        {
          week: state.week,
          year: state.year,
          message: `${emp.name} assigned to ${epic.name}`,
        },
        ...state.log,
      ].slice(0, 200);

      return { ...state, epics: newEpics, employees: newEmployees, log: newLog };
    }

    case 'UNASSIGN_EMPLOYEE': {
      const { employeeId } = action;
      const emp = state.employees.find((e) => e.id === employeeId);
      const oldEpic = state.epics.find((e) => e.id === emp?.assignedEpicId);

      const newEpics = state.epics.map((e) => ({
        ...e,
        assignedEmployeeIds: e.assignedEmployeeIds.filter(
          (id) => id !== employeeId
        ),
      }));

      const newEmployees = state.employees.map((e) =>
        e.id === employeeId ? { ...e, assignedEpicId: null } : e
      );

      const newLog = [
        {
          week: state.week,
          year: state.year,
          message: `${emp.name} unassigned from ${oldEpic?.name || 'epic'}`,
        },
        ...state.log,
      ].slice(0, 200);

      return { ...state, epics: newEpics, employees: newEmployees, log: newLog };
    }

    case 'TOGGLE_PAUSE':
      return { ...state, paused: !state.paused };
    case 'SET_SPEED':
      return { ...state, speed: action.speed };
    case 'SET_TAB':
      return { ...state, activeTab: action.tab };
    case 'SET_COMPANY_NAME':
      return { ...state, companyName: action.name };
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };
    case 'RESTART': {
      const newEmployees = generateInitialEmployees(10);
      const newName = generateCompanyName();
      return {
        ...initialState,
        companyName: `${newName} Inc.`,
        employees: newEmployees,
        products: makeInitialProducts(),
        epics: makeInitialEpics(),
        theme: state.theme,
        log: [{ week: 1, year: 1, message: 'Game started with 10 employees' }],
        yearlyExpenses: { 1: { salaries: 0 } },
        yearlyRevenue: { 1: 0 },
      };
    }
    default:
      return state;
  }
}
