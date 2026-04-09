import { generateInitialEmployees, generateCompanyName } from './helpers';

// === Factory functions ===

function makeAppifyMVP() {
  return {
    id: 'appify-mvp',
    name: 'Appify MVP',
    productId: 'appify',
    type: 'mvp',
    status: 'Active',
    devCostPerMonth: 50000,
    totalDevSpend: 0,
    createdWeek: 1,
    completedWeek: null,
    epics: [
      {
        id: 'appify-mvp-design',
        name: 'Product Design & UI Development',
        projectId: 'appify-mvp',
        assignedEmployeeIds: [],
        totalWork: 12,
        workCompleted: 0,
        status: 'Not Started',
        baseHeadcount: 1,
      },
      {
        id: 'appify-mvp-infra',
        name: 'Infrastructure & Security',
        projectId: 'appify-mvp',
        assignedEmployeeIds: [],
        totalWork: 12,
        workCompleted: 0,
        status: 'Not Started',
        baseHeadcount: 1,
      },
    ],
    onComplete: {
      createProduct: {
        id: 'appify',
        name: 'Appify',
        type: 'SaaS',
      },
      spawnProjects: [
        { factory: 'infra', productId: 'appify', productName: 'Appify', args: { yearNum: 1 } },
        { factory: 'upgrade', productId: 'appify', productName: 'Appify', args: {
          version: 'v1',
          devCostPerMonth: 50000,
          totalWork: 48,
          baseHeadcount: 1,
          upgradeProduct: {
            setVersion: 'v1',
            configOverrides: { infraBaseCost: 75000 },
            configDeltas: { baseRetentionRate: 0.10 },
          },
        }},
      ],
      capitalTrigger: 'mvp',
      notifications: [
        { message: 'Capital opportunities available!', tab: 'balance' },
      ],
    },
  };
}

function makeDefaultProductConfig() {
  return {
    signupsPerMonth: 100,
    baseRetentionRate: 0.20,
    basePrice: 500,
    retentionDropPerCR: 0.0004,
    retentionGainPerCR: 0.0002,
    baseChurnRate: 0.20,
    churnIncreasePerCR: 0.0004,
    churnDecreasePerCR: 0.0002,
    freeTrialWeeks: 4,
    weeklyVariance: 0.03,
    infraCostPerUser: 50,
    infraBaseCost: 0,
  };
}

function createLiveProduct(productId, name, type, launchedWeek) {
  return {
    id: productId,
    name,
    type,
    status: 'Live',
    launchedWeek,
    monthlyPrice: 500,
    config: makeDefaultProductConfig(),
    cohorts: [],
    financials: { totalRevenue: 0, totalInfraCost: 0 },
    lastMonthStats: { signups: 0, converted: 0, churned: 0 },
    currentVersion: 'mvp',
    infraStaffed: false,
  };
}

function createUpgradeProject(productId, productName, args, createdWeek) {
  const { version, devCostPerMonth = 50000, totalWork = 48, baseHeadcount = 1, upgradeProduct, spawnProjects, notifications } = args;
  const projId = `${productId}-${version}`;
  return {
    id: projId,
    name: `${productName} ${version.toUpperCase()}`,
    productId,
    type: 'upgrade',
    status: 'Active',
    devCostPerMonth,
    totalDevSpend: 0,
    createdWeek,
    completedWeek: null,
    epics: [
      {
        id: `${projId}-main`,
        name: `${productName} ${version.toUpperCase()} Development`,
        projectId: projId,
        assignedEmployeeIds: [],
        totalWork,
        workCompleted: 0,
        status: 'Not Started',
        baseHeadcount,
      },
    ],
    onComplete: {
      upgradeProduct,
      spawnProjects: spawnProjects || [],
      notifications: notifications || [
        { message: `${productName} ${version.toUpperCase()} is live!`, tab: 'growth' },
      ],
    },
  };
}

function createInfraProject(productId, productName, yearNum, createdWeek) {
  const projId = `${productId}-infra-y${yearNum}`;
  return {
    id: projId,
    name: `${productName} Infra Y${yearNum}`,
    productId,
    type: 'infra',
    status: 'Active',
    devCostPerMonth: 50000,
    totalDevSpend: 0,
    createdWeek,
    completedWeek: null,
    epics: [
      {
        id: `${projId}-main`,
        name: 'Production Infrastructure & Maintenance',
        projectId: projId,
        assignedEmployeeIds: [],
        totalWork: 104,
        workCompleted: 0,
        status: 'Not Started',
        baseHeadcount: 1,
      },
    ],
  };
}

// === Capital opportunity factories ===

function calcEMI(principal, annualRate, termMonths) {
  const r = annualRate / 12;
  if (r === 0) return principal / termMonths;
  const factor = Math.pow(1 + r, termMonths);
  return (principal * r * factor) / (factor - 1);
}

function createMVPCapitalOpportunities(totalWeeks) {
  return [
    {
      id: `loan-central-bank-${totalWeeks}`,
      type: 'loan',
      name: 'Central Bank Loan',
      description: '₹50L loan at 8% p.a., monthly EMI over 3 years',
      amount: 5_000_000,
      interestRate: 0.08,
      termMonths: 36,
      monthlyPayment: calcEMI(5_000_000, 0.08, 36),
      availableFromWeek: totalWeeks,
      expiresAtWeek: totalWeeks + 24, // 6 months
      status: 'available',
      trigger: 'mvp',
    },
    {
      id: `grant-state-govt-${totalWeeks}`,
      type: 'grant',
      name: 'State Government Grant',
      description: '₹10L grant — no repayment required',
      amount: 1_000_000,
      availableFromWeek: totalWeeks,
      expiresAtWeek: totalWeeks + 24,
      status: 'available',
      trigger: 'mvp',
    },
  ];
}

// === Game logic helpers ===

export function effectiveWork(headcount, baseHeadcount = 3) {
  if (headcount === 0) return 0;
  return Math.min(headcount, baseHeadcount) + Math.max(0, headcount - baseHeadcount) * 0.5;
}

export function weeksRemaining(epic) {
  const remaining = epic.totalWork - epic.workCompleted;
  if (remaining <= 0) return 0;
  const eff = effectiveWork(epic.assignedEmployeeIds.length, epic.baseHeadcount);
  if (eff === 0) return Infinity;
  return Math.ceil(remaining / eff);
}

export function calcRetentionRate(config, monthlyPrice) {
  const priceDiff = monthlyPrice - config.basePrice;
  let rate;
  if (priceDiff > 0) {
    rate = config.baseRetentionRate - priceDiff * config.retentionDropPerCR;
  } else {
    rate = config.baseRetentionRate + Math.abs(priceDiff) * config.retentionGainPerCR;
  }
  return Math.max(0.02, Math.min(0.95, rate));
}

export function calcChurnRate(config, monthlyPrice) {
  const priceDiff = monthlyPrice - config.basePrice;
  let rate;
  if (priceDiff > 0) {
    rate = config.baseChurnRate + priceDiff * config.churnIncreasePerCR;
  } else {
    rate = config.baseChurnRate - Math.abs(priceDiff) * config.churnDecreasePerCR;
  }
  return Math.max(0.02, Math.min(0.80, rate));
}

export function getProductUserStats(product) {
  let trialUsers = 0;
  let payingUsers = 0;
  for (const c of product.cohorts) {
    if (c.status === 'trial') trialUsers += c.totalSignups;
    else payingUsers += c.payingUsers;
  }
  return { trialUsers, payingUsers, totalActive: trialUsers + payingUsers };
}

export function findEpicInProjects(epicId, devProjects) {
  for (const proj of devProjects) {
    const epic = proj.epics.find((e) => e.id === epicId);
    if (epic) return { project: proj, epic };
  }
  return null;
}

// === State initialization ===

const initialEmployees = generateInitialEmployees(2);
const companyName = generateCompanyName();

function makeInitialYearExpenses() {
  return { salaries: 0, devProjects: {}, productInfra: {}, loanRepayments: 0 };
}

function makeInitialYearRevenue() {
  return { products: {} };
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
  devProjects: [makeAppifyMVP()],
  products: [],
  log: [{ week: 1, year: 1, message: 'Game started with 2 employees' }],
  yearlyExpenses: { 1: makeInitialYearExpenses() },
  yearlyRevenue: { 1: makeInitialYearRevenue() },
  currentMonthExpenses: { salaries: 0, devProjects: {}, productInfra: {} },
  currentMonthRevenue: { products: {} },
  gameOver: false,
  activeTab: 'dashboard',
  negotiatingEmployeeId: null,
  pendingNegotiations: [],
  currency: { symbol: '₹', name: 'Rupee' },
  capitalOpportunities: [],
  activeLoans: [],
  notifications: [],
  nextNotificationId: 1,
};

// === Helpers ===

function removeEmployeeFromAll(employeeId, devProjects) {
  return devProjects.map((proj) => ({
    ...proj,
    epics: proj.epics.map((epic) => ({
      ...epic,
      assignedEmployeeIds: epic.assignedEmployeeIds.filter((id) => id !== employeeId),
    })),
  }));
}

// === Reducer ===

export function gameReducer(state, action) {
  switch (action.type) {
    case 'TICK': {
      if (state.paused || state.gameOver) return state;

      // 1. Advance week counter
      let newWeek = state.week + 1;
      let newYear = state.year;
      const isYearEnd = newWeek > 52;
      if (isYearEnd) {
        newWeek = 1;
        newYear += 1;
      }
      const newTotalWeeks = state.totalWeeks + 1;

      // Deep copy mutable state
      const employees = state.employees.map((e) => ({ ...e, personality: { ...e.personality } }));
      let devProjects = state.devProjects.map((p) => ({
        ...p,
        epics: p.epics.map((e) => ({ ...e, assignedEmployeeIds: [...e.assignedEmployeeIds] })),
      }));
      const products = state.products.map((p) => ({
        ...p,
        config: { ...p.config },
        financials: { ...p.financials },
        lastMonthStats: { ...p.lastMonthStats },
        cohorts: p.cohorts.map((c) => ({ ...c })),
      }));

      const log = [...state.log];
      let bankDelta = 0;

      // Initialize yearly accumulators
      const yearExp = { ...(state.yearlyExpenses[newYear] || makeInitialYearExpenses()) };
      yearExp.devProjects = { ...(yearExp.devProjects || {}) };
      yearExp.productInfra = { ...(yearExp.productInfra || {}) };
      const yearRev = { ...(state.yearlyRevenue[newYear] || makeInitialYearRevenue()) };
      yearRev.products = { ...(yearRev.products || {}) };

      const weekExpDevProjects = {};
      const weekExpProductInfra = {};
      const weekRevProducts = {};

      // 2. Process payroll (monthly — every 4 weeks)
      const isMonthEnd = newTotalWeeks % 4 === 0;
      const activeEmps = employees.filter((e) => e.status === 'Active');
      if (isMonthEnd) {
        const monthlyPayroll = activeEmps.reduce((sum, e) => sum + e.salary, 0);
        bankDelta -= monthlyPayroll;
        yearExp.salaries += monthlyPayroll;

        log.unshift({
          week: newWeek, year: newYear,
          message: `Payroll processed — ${state.currency.symbol}${Math.round(monthlyPayroll).toLocaleString('en-US')} debited`,
        });
      }

      const newNotifications = [];
      let notifId = state.nextNotificationId;

      // 2b. Process active loan repayments (monthly)
      const activeLoans = state.activeLoans.map((l) => ({ ...l }));
      if (isMonthEnd) {
        for (const loan of activeLoans) {
          if (loan.remainingPayments <= 0) continue;
          bankDelta -= loan.monthlyPayment;
          loan.remainingBalance -= (loan.monthlyPayment - loan.remainingBalance * (loan.interestRate / 12));
          loan.remainingPayments -= 1;
          loan.totalPaid += loan.monthlyPayment;
          yearExp.loanRepayments = (yearExp.loanRepayments || 0) + loan.monthlyPayment;
          if (loan.remainingPayments <= 0) {
            loan.remainingBalance = 0;
            log.unshift({ week: newWeek, year: newYear, message: `${loan.name} fully repaid!` });
          }
        }
      }

      // 2c. Expire capital opportunities
      let capitalOpportunities = state.capitalOpportunities.map((c) => ({ ...c }));
      const newCapitalOpportunities = [];
      for (const opp of capitalOpportunities) {
        if (opp.status === 'available' && newTotalWeeks > opp.expiresAtWeek) {
          opp.status = 'expired';
          log.unshift({ week: newWeek, year: newYear, message: `Capital opportunity expired: ${opp.name}` });
        }
      }

      // 3. Process dev projects
      const freedEmployeeIds = new Set();
      const newDevProjectsToAdd = [];

      for (const proj of devProjects) {
        if (proj.status !== 'Active') continue;

        const hadInProgressEpics = proj.epics.some((e) => e.status === 'In Progress');

        // Process epic work
        for (const epic of proj.epics) {
          if (epic.status === 'Complete') continue;
          if (epic.assignedEmployeeIds.length === 0) continue;

          const eff = effectiveWork(epic.assignedEmployeeIds.length, epic.baseHeadcount);
          epic.workCompleted = Math.min(epic.workCompleted + eff, epic.totalWork);

          if (epic.workCompleted >= epic.totalWork) {
            epic.status = 'Complete';
            epic.assignedEmployeeIds.forEach((id) => freedEmployeeIds.add(id));
            epic.assignedEmployeeIds = [];
            log.unshift({ week: newWeek, year: newYear, message: `${epic.name} completed!` });
          } else {
            epic.status = 'In Progress';
          }
        }

        // Charge dev cost monthly
        if (hadInProgressEpics && isMonthEnd) {
          bankDelta -= proj.devCostPerMonth;
          proj.totalDevSpend += proj.devCostPerMonth;
          weekExpDevProjects[proj.id] = (weekExpDevProjects[proj.id] || 0) + proj.devCostPerMonth;
          yearExp.devProjects[proj.id] = (yearExp.devProjects[proj.id] || 0) + proj.devCostPerMonth;
        }

        // Check if all epics are now complete
        const allComplete = proj.epics.every((e) => e.status === 'Complete');
        if (allComplete && proj.epics.length > 0) {
          proj.status = 'Complete';
          proj.completedWeek = newTotalWeeks;

          const oc = proj.onComplete;
          if (oc) {
            log.unshift({ week: newWeek, year: newYear, message: `${proj.name} shipped!` });

            // Create a new product
            if (oc.createProduct) {
              const cp = oc.createProduct;
              products.push(createLiveProduct(cp.id, cp.name, cp.type || 'SaaS', newTotalWeeks));
              log.unshift({ week: newWeek, year: newYear, message: `${cp.name} is now live.` });
            }

            // Upgrade an existing product
            if (oc.upgradeProduct) {
              const up = oc.upgradeProduct;
              const product = products.find((p) => p.id === proj.productId);
              if (product) {
                if (up.setVersion) product.currentVersion = up.setVersion;
                if (up.configOverrides) {
                  for (const [k, v] of Object.entries(up.configOverrides)) product.config[k] = v;
                }
                if (up.configDeltas) {
                  for (const [k, d] of Object.entries(up.configDeltas)) {
                    product.config[k] = Math.max(0, Math.min(0.95, (product.config[k] || 0) + d));
                  }
                }
              }
            }

            // Spawn follow-up projects
            if (oc.spawnProjects) {
              for (const sp of oc.spawnProjects) {
                let newProj;
                if (sp.factory === 'infra') {
                  newProj = createInfraProject(sp.productId, sp.productName, sp.args.yearNum, newTotalWeeks);
                } else if (sp.factory === 'upgrade') {
                  newProj = createUpgradeProject(sp.productId, sp.productName, sp.args, newTotalWeeks);
                }
                if (newProj) {
                  newDevProjectsToAdd.push(newProj);
                  log.unshift({ week: newWeek, year: newYear, message: `${newProj.name} project created. Assign engineers.` });
                }
              }
            }

            // Capital opportunities
            if (oc.capitalTrigger === 'mvp') {
              newCapitalOpportunities.push(...createMVPCapitalOpportunities(newTotalWeeks));
              log.unshift({ week: newWeek, year: newYear, message: 'New capital opportunities available! Check the Finances tab.' });
            }

            // Notifications
            if (oc.notifications) {
              for (const n of oc.notifications) {
                newNotifications.push({ id: notifId++, message: n.message, tab: n.tab });
              }
            }
          } else {
            // Projects without onComplete (e.g. infra)
            log.unshift({ week: newWeek, year: newYear, message: `${proj.name} completed.` });
          }
        }
      }

      devProjects = [...devProjects, ...newDevProjectsToAdd];

      // Free employees from completed epics
      for (const emp of employees) {
        if (freedEmployeeIds.has(emp.id)) emp.assignment = null;
      }

      // 4. Process live products
      for (const product of products) {
        const cfg = product.config;
        const weeksSinceLaunch = newTotalWeeks - product.launchedWeek;

        // Check if infra is staffed — product is paused if no active infra project has assigned engineers
        const activeInfra = devProjects.find(
          (p) => p.productId === product.id && p.type === 'infra' && p.status === 'Active'
        );
        const infraStaffed = activeInfra && activeInfra.epics.some(
          (e) => e.status !== 'Complete' && e.assignedEmployeeIds.length > 0
        );
        product.infraStaffed = infraStaffed;

        // Check if new annual infra project needed
        if (weeksSinceLaunch > 0 && weeksSinceLaunch % 52 === 0) {
          const existingInfra = devProjects.filter((p) => p.productId === product.id && p.type === 'infra');
          const yearNum = existingInfra.length + 1;
          const newInfra = createInfraProject(product.id, product.name, yearNum, newTotalWeeks);
          devProjects.push(newInfra);
          log.unshift({ week: newWeek, year: newYear, message: `${product.name} Infra Y${yearNum} project created. Assign engineers.` });
        }

        if (!infraStaffed) continue;

        // Monthly cycle (every 4 weeks from launch)
        if (weeksSinceLaunch > 0 && weeksSinceLaunch % 4 === 0) {
          const retentionBase = calcRetentionRate(cfg, product.monthlyPrice);
          const churnBase = calcChurnRate(cfg, product.monthlyPrice);
          const retentionRate = Math.max(0.02, Math.min(0.95,
            retentionBase + (Math.random() * 2 - 1) * cfg.weeklyVariance
          ));
          const churnRate = Math.max(0.02, Math.min(0.80,
            churnBase + (Math.random() * 2 - 1) * cfg.weeklyVariance
          ));

          let monthlyConverted = 0;
          let monthlyChurned = 0;

          // Convert trial cohorts whose trial ended
          for (const c of product.cohorts) {
            if (c.status !== 'trial') continue;
            if (newTotalWeeks - c.signupWeek >= cfg.freeTrialWeeks) {
              const paying = Math.floor(c.totalSignups * retentionRate);
              monthlyConverted += paying;
              c.status = 'active';
              c.payingUsers = paying;
            }
          }

          // Churn from paying users
          const totalPaying = product.cohorts.reduce(
            (s, c) => s + (c.status === 'active' ? c.payingUsers : 0), 0
          );
          let toChurn = Math.floor(totalPaying * churnRate);
          monthlyChurned = toChurn;
          for (const c of product.cohorts) {
            if (toChurn <= 0) break;
            if (c.status === 'active' && c.payingUsers > 0) {
              const remove = Math.min(toChurn, c.payingUsers);
              c.payingUsers -= remove;
              toChurn -= remove;
            }
          }
          product.cohorts = product.cohorts.filter((c) => c.status === 'trial' || c.payingUsers > 0);

          // New signups
          product.cohorts.push({
            signupWeek: newTotalWeeks,
            totalSignups: cfg.signupsPerMonth,
            status: 'trial',
            payingUsers: 0,
          });

          product.lastMonthStats = {
            signups: cfg.signupsPerMonth,
            converted: monthlyConverted,
            churned: monthlyChurned,
          };

          const stats = getProductUserStats(product);
          log.unshift({
            week: newWeek, year: newYear,
            message: `${product.name}: ${cfg.signupsPerMonth} signups, ${monthlyConverted} converted, ${monthlyChurned} churned. Active: ${stats.totalActive}`,
          });
        }

        // Monthly revenue & infra cost
        if (isMonthEnd) {
          const stats = getProductUserStats(product);
          const revenue = stats.payingUsers * product.monthlyPrice;
          bankDelta += revenue;
          product.financials.totalRevenue += revenue;
          weekRevProducts[product.id] = (weekRevProducts[product.id] || 0) + revenue;
          yearRev.products[product.id] = (yearRev.products[product.id] || 0) + revenue;

          const infraCost = cfg.infraBaseCost + stats.totalActive * cfg.infraCostPerUser;
          bankDelta -= infraCost;
          product.financials.totalInfraCost += infraCost;
          weekExpProductInfra[product.id] = (weekExpProductInfra[product.id] || 0) + infraCost;
          yearExp.productInfra[product.id] = (yearExp.productInfra[product.id] || 0) + infraCost;
        }
      }

      // 5. Yearly boundary: happiness and attrition
      const pendingNegotiations = [];
      if (isYearEnd) {
        for (const emp of employees) {
          if (emp.status !== 'Active') continue;

          const salaryDelta = emp.salary - (emp.previousSalary + 100);
          const salaryPenalty = salaryDelta < 0
            ? (Math.abs(salaryDelta) / 1000) * emp.personality.salaryPriority
            : 0;

          emp.happiness = Math.max(0, Math.min(100,
            emp.happiness - emp.personality.restlessness - salaryPenalty
          ));
          emp.previousSalary = emp.salary;
          emp.lastHappinessUpdate = newTotalWeeks;

          if (emp.happiness < 50 && Math.random() < 0.5) {
            pendingNegotiations.push(emp.id);
          }
        }

        if (pendingNegotiations.length > 0) {
          const firstEmp = employees.find((e) => e.id === pendingNegotiations[0]);
          firstEmp.status = 'Negotiating';
          log.unshift({
            week: newWeek, year: newYear,
            message: `${firstEmp.name} is unhappy and considering leaving`,
          });
        }
      }

      // 6. Trim log
      while (log.length > 200) log.pop();

      // 7. Bank and game over
      const newBank = state.bank + bankDelta;
      const gameOver = newBank <= 0;
      if (gameOver) {
        log.unshift({ week: newWeek, year: newYear, message: 'GAME OVER — Startup ran out of money!' });
      }

      return {
        ...state,
        week: newWeek,
        year: newYear,
        totalWeeks: newTotalWeeks,
        bank: newBank,
        employees,
        devProjects,
        products,
        yearlyExpenses: { ...state.yearlyExpenses, [newYear]: yearExp },
        yearlyRevenue: { ...state.yearlyRevenue, [newYear]: yearRev },
        currentMonthExpenses: isMonthEnd
          ? { salaries: activeEmps.reduce((s, e) => s + e.salary, 0), devProjects: weekExpDevProjects, productInfra: weekExpProductInfra }
          : state.currentMonthExpenses,
        currentMonthRevenue: isMonthEnd ? { products: weekRevProducts } : state.currentMonthRevenue,
        log,
        gameOver,
        paused: gameOver || pendingNegotiations.length > 0 ? true : state.paused,
        negotiatingEmployeeId: pendingNegotiations.length > 0 ? pendingNegotiations[0] : null,
        pendingNegotiations,
        capitalOpportunities: [...capitalOpportunities, ...newCapitalOpportunities],
        activeLoans: activeLoans.filter((l) => l.remainingPayments > 0),
        notifications: [...state.notifications, ...newNotifications],
        nextNotificationId: notifId,
      };
    }

    case 'ASSIGN_EMPLOYEE': {
      const { employeeId, epicId } = action;
      const found = findEpicInProjects(epicId, state.devProjects);
      if (!found || found.epic.status === 'Complete') return state;

      let newDevProjects = removeEmployeeFromAll(employeeId, state.devProjects);
      newDevProjects = newDevProjects.map((proj) =>
        proj.id === found.project.id
          ? {
              ...proj,
              epics: proj.epics.map((e) =>
                e.id === epicId
                  ? {
                      ...e,
                      assignedEmployeeIds: [...e.assignedEmployeeIds, employeeId],
                      status: e.status === 'Not Started' ? 'In Progress' : e.status,
                    }
                  : e
              ),
            }
          : proj
      );

      const newEmployees = state.employees.map((emp) =>
        emp.id === employeeId ? { ...emp, assignment: epicId } : emp
      );

      const emp = state.employees.find((e) => e.id === employeeId);
      const newLog = [
        { week: state.week, year: state.year, message: `${emp.name} assigned to ${found.epic.name}` },
        ...state.log,
      ].slice(0, 200);

      return { ...state, devProjects: newDevProjects, employees: newEmployees, log: newLog };
    }

    case 'UNASSIGN_EMPLOYEE': {
      const { employeeId } = action;
      const emp = state.employees.find((e) => e.id === employeeId);
      if (!emp) return state;

      let label = 'their assignment';
      if (emp.assignment) {
        const found = findEpicInProjects(emp.assignment, state.devProjects);
        if (found) label = `${found.project.name}: ${found.epic.name}`;
      }

      const newDevProjects = removeEmployeeFromAll(employeeId, state.devProjects);
      const newEmployees = state.employees.map((e) =>
        e.id === employeeId ? { ...e, assignment: null } : e
      );

      const newLog = [
        { week: state.week, year: state.year, message: `${emp.name} unassigned from ${label}` },
        ...state.log,
      ].slice(0, 200);

      return { ...state, devProjects: newDevProjects, employees: newEmployees, log: newLog };
    }

    case 'SET_PRICE': {
      const { productId, price } = action;
      const newProducts = state.products.map((p) =>
        p.id === productId ? { ...p, monthlyPrice: price } : p
      );
      return { ...state, products: newProducts };
    }

    case 'NEGOTIATE_OFFER': {
      const { employeeId, newSalary } = action;
      const emp = state.employees.find((e) => e.id === employeeId);
      if (!emp || emp.status !== 'Negotiating') return state;

      const minRaise = emp.personality.salaryPriority * 1000;
      const accepted = newSalary >= emp.salary + minRaise;

      let newEmployees;
      let newDevProjects = state.devProjects;
      const newLog = [...state.log];

      if (accepted) {
        newEmployees = state.employees.map((e) =>
          e.id === employeeId
            ? { ...e, salary: newSalary, previousSalary: newSalary, happiness: 60, status: 'Active' }
            : e
        );
        newLog.unshift({
          week: state.week, year: state.year,
          message: `${emp.name} accepted raise to ${state.currency.symbol}${newSalary.toLocaleString('en-US')}`,
        });
      } else {
        newDevProjects = removeEmployeeFromAll(employeeId, state.devProjects);
        newEmployees = state.employees.map((e) =>
          e.id === employeeId ? { ...e, status: 'Left', assignment: null } : e
        );
        newLog.unshift({
          week: state.week, year: state.year,
          message: `${emp.name} rejected offer and left`,
        });
      }

      const remaining = state.pendingNegotiations.slice(1);
      const nextId = remaining.length > 0 ? remaining[0] : null;

      if (nextId) {
        newEmployees = newEmployees.map((e) =>
          e.id === nextId ? { ...e, status: 'Negotiating' } : e
        );
        const nextEmp = newEmployees.find((e) => e.id === nextId);
        newLog.unshift({
          week: state.week, year: state.year,
          message: `${nextEmp.name} is unhappy and considering leaving`,
        });
      }

      return {
        ...state,
        employees: newEmployees,
        devProjects: newDevProjects,
        log: newLog.slice(0, 200),
        negotiatingEmployeeId: nextId,
        pendingNegotiations: remaining,
      };
    }

    case 'LET_EMPLOYEE_GO': {
      const { employeeId } = action;
      const emp = state.employees.find((e) => e.id === employeeId);
      if (!emp || emp.status !== 'Negotiating') return state;

      const newDevProjects = removeEmployeeFromAll(employeeId, state.devProjects);
      let newEmployees = state.employees.map((e) =>
        e.id === employeeId ? { ...e, status: 'Left', assignment: null } : e
      );

      const newLog = [
        { week: state.week, year: state.year, message: `${emp.name} has left the company` },
        ...state.log,
      ];

      const remaining = state.pendingNegotiations.slice(1);
      const nextId = remaining.length > 0 ? remaining[0] : null;

      if (nextId) {
        newEmployees = newEmployees.map((e) =>
          e.id === nextId ? { ...e, status: 'Negotiating' } : e
        );
        const nextEmp = newEmployees.find((e) => e.id === nextId);
        newLog.unshift({
          week: state.week, year: state.year,
          message: `${nextEmp.name} is unhappy and considering leaving`,
        });
      }

      return {
        ...state,
        employees: newEmployees,
        devProjects: newDevProjects,
        log: newLog.slice(0, 200),
        negotiatingEmployeeId: nextId,
        pendingNegotiations: remaining,
      };
    }

    case 'TOGGLE_PAUSE':
      if (state.negotiatingEmployeeId) return state;
      return { ...state, paused: !state.paused };
    case 'SET_SPEED':
      return { ...state, speed: action.speed };
    case 'SET_TAB':
      return { ...state, activeTab: action.tab };
    case 'SET_COMPANY_NAME':
      return { ...state, companyName: action.name };
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };
    case 'SET_CURRENCY':
      return { ...state, currency: action.currency };
    case 'ADMIN_SET': {
      const { path, value } = action;
      const s = { ...state };

      // Top-level fields
      if (path.length === 1) {
        s[path[0]] = value;
        return s;
      }

      // Products: ['products', productId, ...rest]
      if (path[0] === 'products') {
        const [, productId, ...rest] = path;
        s.products = state.products.map((p) => {
          if (p.id !== productId) return p;
          const np = { ...p, config: { ...p.config } };
          if (rest.length === 1) np[rest[0]] = value;
          else if (rest[0] === 'config') np.config[rest[1]] = value;
          return np;
        });
        return s;
      }

      // Dev projects: ['devProjects', projId, field]
      if (path[0] === 'devProjects') {
        const [, projId, field] = path;
        s.devProjects = state.devProjects.map((p) =>
          p.id === projId ? { ...p, [field]: value } : p
        );
        return s;
      }

      // Epics: ['epics', projId, epicId, field]
      if (path[0] === 'epics') {
        const [, projId, epicId, field] = path;
        s.devProjects = state.devProjects.map((p) =>
          p.id !== projId ? p : {
            ...p,
            epics: p.epics.map((e) =>
              e.id === epicId ? { ...e, [field]: value } : e
            ),
          }
        );
        return s;
      }

      // Employees: ['employees', empId, ...rest]
      if (path[0] === 'employees') {
        const [, empId, ...rest] = path;
        s.employees = state.employees.map((e) => {
          if (e.id !== empId) return e;
          const ne = { ...e, personality: { ...e.personality } };
          if (rest.length === 1) ne[rest[0]] = value;
          else if (rest[0] === 'personality') ne.personality[rest[1]] = value;
          return ne;
        });
        return s;
      }

      return state;
    }

    case 'DISMISS_NOTIFICATION': {
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.id),
      };
    }

    case 'ACCEPT_CAPITAL': {
      const { opportunityId } = action;
      const opp = state.capitalOpportunities.find((c) => c.id === opportunityId);
      if (!opp || opp.status !== 'available') return state;

      const newCapitalOpportunities = state.capitalOpportunities.map((c) =>
        c.id === opportunityId ? { ...c, status: 'accepted' } : c
      );

      let newActiveLoans = state.activeLoans;
      if (opp.type === 'loan') {
        newActiveLoans = [...state.activeLoans, {
          id: opp.id,
          name: opp.name,
          principal: opp.amount,
          interestRate: opp.interestRate,
          monthlyPayment: opp.monthlyPayment,
          remainingPayments: opp.termMonths,
          remainingBalance: opp.amount,
          totalPaid: 0,
          acceptedWeek: state.totalWeeks,
        }];
      }

      const newLog = [
        {
          week: state.week, year: state.year,
          message: opp.type === 'loan'
            ? `Accepted ${opp.name}: ${state.currency.symbol}${opp.amount.toLocaleString('en-US')} credited`
            : `Received ${opp.name}: ${state.currency.symbol}${opp.amount.toLocaleString('en-US')} credited`,
        },
        ...state.log,
      ].slice(0, 200);

      return {
        ...state,
        bank: state.bank + opp.amount,
        capitalOpportunities: newCapitalOpportunities,
        activeLoans: newActiveLoans,
        log: newLog,
      };
    }

    case 'RESTART': {
      const newEmps = generateInitialEmployees(2);
      const newName = generateCompanyName();
      return {
        ...initialState,
        companyName: `${newName} Inc.`,
        employees: newEmps,
        devProjects: [makeAppifyMVP()],
        products: [],
        theme: state.theme,
        currency: state.currency,
        log: [{ week: 1, year: 1, message: 'Game started with 2 employees' }],
        yearlyExpenses: { 1: makeInitialYearExpenses() },
        yearlyRevenue: { 1: makeInitialYearRevenue() },
      };
    }
    default:
      return state;
  }
}
