import { generateInitialEmployees, generateCompanyName } from './helpers';

const TOTAL_WORK = 36;

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

function makeDefaultRevenueConfig() {
  return {
    monthlyPrice: 5,
    signupsPerMonth: 100,
    baseConversionRate: 0.20,
    conversionPriceBase: 5,
    conversionDecreasePerCR: 0.02,
    conversionIncreasePerCR: 0.01,
    monthlyChurnRate: 0.20,
    freeTrialWeeks: 4,
    infraCostPerUser: 0.5,
    infraBaseCost: 500,
  };
}

function makeInitialProducts() {
  return [
    {
      id: 'appify',
      name: 'Appify',
      type: 'SaaS',
      phase: 'development', // 'development' | 'production'
      status: 'In Development',
      launchedWeek: null,
      devCostPerWeek: 2000,
      revenueConfig: makeDefaultRevenueConfig(),
      // Production infra
      infraEmployeeIds: [],
      infraMinStaff: 2,
      cohorts: [],
      financials: {
        totalRevenue: 0,
        totalInfraCost: 0,
        totalDevCost: 0,
      },
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

function calcConversionRate(config) {
  let rate;
  if (config.monthlyPrice <= config.conversionPriceBase) {
    const discount = config.conversionPriceBase - config.monthlyPrice;
    rate = config.baseConversionRate + discount * config.conversionIncreasePerCR;
  } else {
    const premium = config.monthlyPrice - config.conversionPriceBase;
    rate = config.baseConversionRate - premium * config.conversionDecreasePerCR;
  }
  return Math.max(0.01, Math.min(0.95, rate));
}

function getProductUserStats(product) {
  let trialUsers = 0;
  let payingUsers = 0;
  for (const c of product.cohorts) {
    if (c.status === 'trial') trialUsers += c.totalSignups;
    else payingUsers += c.payingUsers;
  }
  return { trialUsers, payingUsers, totalActive: trialUsers + payingUsers };
}

function isInfraOperational(product) {
  return product.infraEmployeeIds.length >= product.infraMinStaff;
}

export { effectiveWork, weeksRemaining, calcConversionRate, getProductUserStats, isInfraOperational };

const initialEmployees = generateInitialEmployees(10);
const companyName = generateCompanyName();

function makeInitialYearExpenses() {
  return { salaries: 0, devCosts: 0, infraCosts: 0 };
}

function makeInitialYearRevenue() {
  return { subscriptions: 0 };
}

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
  yearlyExpenses: { 1: makeInitialYearExpenses() },
  yearlyRevenue: { 1: makeInitialYearRevenue() },
  currentWeekExpenses: { salaries: 0, devCosts: 0, infraCosts: 0 },
  currentWeekRevenue: { subscriptions: 0 },
  gameOver: false,
  activeTab: 'dashboard',
};

// Helper to remove an employee from all assignments (epics + product infra)
function removeEmployeeFromAll(employeeId, epics, products) {
  const newEpics = epics.map((e) => ({
    ...e,
    assignedEmployeeIds: e.assignedEmployeeIds.filter((id) => id !== employeeId),
  }));
  const newProducts = products.map((p) => ({
    ...p,
    infraEmployeeIds: p.infraEmployeeIds.filter((id) => id !== employeeId),
  }));
  return { epics: newEpics, products: newProducts };
}

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
      const newTotalWeeks = state.totalWeeks + 1;

      // Payroll
      const activeEmployees = state.employees.filter((e) => e.status === 'Active');
      const weeklyPayroll = activeEmployees.reduce((sum, e) => sum + e.salary / 52, 0);
      let bankDelta = -weeklyPayroll;

      const yearExp = {
        ...(state.yearlyExpenses[newYear] || makeInitialYearExpenses()),
      };
      yearExp.salaries += weeklyPayroll;

      const yearRev = {
        ...(state.yearlyRevenue[newYear] || makeInitialYearRevenue()),
      };

      let weekDevCosts = 0;
      let weekInfraCosts = 0;
      let weekSubRevenue = 0;

      const newLog = [
        {
          week: newWeek, year: newYear,
          message: `Payroll processed — CR ${Math.round(weeklyPayroll).toLocaleString('en-US')} debited`,
        },
        ...state.log,
      ].slice(0, 200);

      // Process epics
      const freedEmployeeIds = new Set();
      let newEpics = state.epics.map((epic) => {
        if (epic.status === 'Complete') return epic;
        const headcount = epic.assignedEmployeeIds.length;
        if (headcount === 0) return epic;

        const eff = effectiveWork(headcount);
        const newWorkCompleted = epic.workCompleted + eff;
        const completed = newWorkCompleted >= epic.totalWork;

        if (completed) {
          newLog.unshift({
            week: newWeek, year: newYear,
            message: `${epic.name} completed!`,
          });
          epic.assignedEmployeeIds.forEach((id) => freedEmployeeIds.add(id));
        }

        return {
          ...epic,
          workCompleted: Math.min(newWorkCompleted, epic.totalWork),
          status: completed ? 'Complete' : 'In Progress',
          assignedEmployeeIds: completed ? [] : epic.assignedEmployeeIds,
        };
      });

      let newEmployees = freedEmployeeIds.size > 0
        ? state.employees.map((e) =>
            freedEmployeeIds.has(e.id) ? { ...e, assignment: null } : e
          )
        : state.employees;

      // Process products
      let newProducts = state.products.map((product) => {
        let p = { ...product, financials: { ...product.financials } };

        // === Development phase ===
        if (p.phase === 'development') {
          const productEpics = newEpics.filter((e) => e.productId === p.id);
          const anyInProgress = productEpics.some((e) => e.status === 'In Progress');

          if (anyInProgress) {
            weekDevCosts += p.devCostPerWeek;
            bankDelta -= p.devCostPerWeek;
            p.financials.totalDevCost += p.devCostPerWeek;
          }

          // Check if all epics done -> transition to production
          const allComplete = productEpics.every((e) => e.status === 'Complete');
          if (allComplete && productEpics.length > 0) {
            p.phase = 'production';
            p.status = 'Live';
            p.launchedWeek = newTotalWeeks;
            p.cohorts = [];
            newLog.unshift({
              week: newWeek, year: newYear,
              message: `${p.name} MVP Development complete! Production infrastructure now needs staffing.`,
            });
          }
          return p;
        }

        // === Production phase ===
        if (p.phase === 'production') {
          const cfg = p.revenueConfig;
          const operational = p.infraEmployeeIds.length >= p.infraMinStaff;

          // Infra cost always applies once live
          const totalActive = getProductUserStats(p).totalActive;
          const infra = cfg.infraBaseCost + totalActive * cfg.infraCostPerUser;
          weekInfraCosts += infra;
          bankDelta -= infra;
          p.financials.totalInfraCost += infra;

          // Revenue & user funnel only if infra is operational
          if (operational) {
            const weeksSinceLaunch = newTotalWeeks - p.launchedWeek;
            let newCohorts = p.cohorts.map((c) => ({ ...c }));

            // Monthly events (every 4 weeks since launch)
            if (weeksSinceLaunch > 0 && weeksSinceLaunch % 4 === 0) {
              const conversionRate = calcConversionRate(cfg);
              let monthlyConverted = 0;
              let monthlyChurned = 0;

              // Convert trial cohorts whose trial ended
              newCohorts = newCohorts.map((c) => {
                if (c.status !== 'trial') return c;
                const trialAge = newTotalWeeks - c.signupWeek;
                if (trialAge >= cfg.freeTrialWeeks) {
                  const paying = Math.floor(c.totalSignups * conversionRate);
                  monthlyConverted += paying;
                  return { ...c, status: 'active', payingUsers: paying };
                }
                return c;
              });

              // Churn
              let totalPaying = newCohorts.reduce(
                (s, c) => s + (c.status === 'active' ? c.payingUsers : 0), 0
              );
              let toChurn = Math.floor(totalPaying * cfg.monthlyChurnRate);
              monthlyChurned = toChurn;
              for (let i = 0; i < newCohorts.length && toChurn > 0; i++) {
                if (newCohorts[i].status === 'active' && newCohorts[i].payingUsers > 0) {
                  const remove = Math.min(toChurn, newCohorts[i].payingUsers);
                  newCohorts[i] = { ...newCohorts[i], payingUsers: newCohorts[i].payingUsers - remove };
                  toChurn -= remove;
                }
              }
              newCohorts = newCohorts.filter((c) => c.status === 'trial' || c.payingUsers > 0);

              // New signups
              const monthlyNewSignups = cfg.signupsPerMonth;
              newCohorts.push({
                signupWeek: newTotalWeeks,
                totalSignups: monthlyNewSignups,
                status: 'trial',
                payingUsers: 0,
              });

              const stats = { paying: 0, trial: 0 };
              for (const c of newCohorts) {
                if (c.status === 'trial') stats.trial += c.totalSignups;
                else stats.paying += c.payingUsers;
              }
              newLog.unshift({
                week: newWeek, year: newYear,
                message: `${p.name}: ${monthlyNewSignups} signups, ${monthlyConverted} converted, ${monthlyChurned} churned. Active: ${stats.trial + stats.paying}`,
              });
            }

            p.cohorts = newCohorts;

            // Weekly revenue
            const totalPaying = p.cohorts.reduce(
              (s, c) => s + (c.status === 'active' ? c.payingUsers : 0), 0
            );
            const revenue = (totalPaying * cfg.monthlyPrice) / 4;
            weekSubRevenue += revenue;
            bankDelta += revenue;
            p.financials.totalRevenue += revenue;
          }
        }

        return p;
      });

      yearExp.devCosts = (yearExp.devCosts || 0) + weekDevCosts;
      yearExp.infraCosts = (yearExp.infraCosts || 0) + weekInfraCosts;
      yearRev.subscriptions = (yearRev.subscriptions || 0) + weekSubRevenue;

      const newBank = state.bank + bankDelta;
      const gameOver = newBank <= 0;
      if (gameOver) {
        newLog.unshift({
          week: newWeek, year: newYear,
          message: 'GAME OVER — Startup ran out of money!',
        });
      }

      return {
        ...state,
        week: newWeek,
        year: newYear,
        totalWeeks: newTotalWeeks,
        bank: newBank,
        employees: newEmployees,
        epics: newEpics,
        products: newProducts,
        yearlyExpenses: { ...state.yearlyExpenses, [newYear]: yearExp },
        yearlyRevenue: { ...state.yearlyRevenue, [newYear]: yearRev },
        currentWeekExpenses: { salaries: weeklyPayroll, devCosts: weekDevCosts, infraCosts: weekInfraCosts },
        currentWeekRevenue: { subscriptions: weekSubRevenue },
        log: newLog,
        gameOver,
        paused: gameOver ? true : state.paused,
      };
    }

    case 'ASSIGN_EMPLOYEE': {
      const { employeeId, epicId } = action;
      const epic = state.epics.find((e) => e.id === epicId);
      if (!epic || epic.status === 'Complete') return state;

      // Remove from everywhere first
      let { epics: newEpics, products: newProducts } = removeEmployeeFromAll(employeeId, state.epics, state.products);

      // Add to epic
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
        emp.id === employeeId ? { ...emp, assignment: epicId } : emp
      );

      const emp = state.employees.find((e) => e.id === employeeId);
      const newLog = [
        { week: state.week, year: state.year, message: `${emp.name} assigned to ${epic.name}` },
        ...state.log,
      ].slice(0, 200);

      return { ...state, epics: newEpics, products: newProducts, employees: newEmployees, log: newLog };
    }

    case 'ASSIGN_INFRA': {
      const { employeeId, productId } = action;
      const product = state.products.find((p) => p.id === productId);
      if (!product || product.phase !== 'production') return state;

      // Remove from everywhere first
      let { epics: newEpics, products: newProducts } = removeEmployeeFromAll(employeeId, state.epics, state.products);

      // Add to product infra
      newProducts = newProducts.map((p) =>
        p.id === productId
          ? { ...p, infraEmployeeIds: [...p.infraEmployeeIds, employeeId] }
          : p
      );

      const newEmployees = state.employees.map((emp) =>
        emp.id === employeeId ? { ...emp, assignment: `${productId}-infra` } : emp
      );

      const emp = state.employees.find((e) => e.id === employeeId);
      const newLog = [
        { week: state.week, year: state.year, message: `${emp.name} assigned to ${product.name} Infrastructure` },
        ...state.log,
      ].slice(0, 200);

      return { ...state, epics: newEpics, products: newProducts, employees: newEmployees, log: newLog };
    }

    case 'UNASSIGN_EMPLOYEE': {
      const { employeeId } = action;
      const emp = state.employees.find((e) => e.id === employeeId);
      if (!emp) return state;

      const oldAssignment = emp.assignment;
      let label = 'their assignment';
      if (oldAssignment) {
        const epic = state.epics.find((e) => e.id === oldAssignment);
        if (epic) label = epic.name;
        else {
          const product = state.products.find((p) => `${p.id}-infra` === oldAssignment);
          if (product) label = `${product.name} Infrastructure`;
        }
      }

      let { epics: newEpics, products: newProducts } = removeEmployeeFromAll(employeeId, state.epics, state.products);

      const newEmployees = state.employees.map((e) =>
        e.id === employeeId ? { ...e, assignment: null } : e
      );

      const newLog = [
        { week: state.week, year: state.year, message: `${emp.name} unassigned from ${label}` },
        ...state.log,
      ].slice(0, 200);

      return { ...state, epics: newEpics, products: newProducts, employees: newEmployees, log: newLog };
    }

    case 'SET_PRICE': {
      const { productId, price } = action;
      const newProducts = state.products.map((p) =>
        p.id === productId
          ? { ...p, revenueConfig: { ...p.revenueConfig, monthlyPrice: price } }
          : p
      );
      return { ...state, products: newProducts };
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
        yearlyExpenses: { 1: makeInitialYearExpenses() },
        yearlyRevenue: { 1: makeInitialYearRevenue() },
      };
    }
    default:
      return state;
  }
}
