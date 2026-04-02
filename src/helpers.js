const VOWELS = 'aeiou';
const CONSONANTS = 'bcdfghjklmnpqrstvwxyz';
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function formatCR(amount) {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (amount < 0) return `(CR ${formatted})`;
  return `CR ${formatted}`;
}

export function generateName(existingNames) {
  let attempts = 0;
  while (attempts < 1000) {
    attempts++;
    const positions = [0, 1, 2, 3, 4];
    const shuffled = [...positions].sort(() => Math.random() - 0.5);
    const vowelPositions = new Set(shuffled.slice(0, 2));

    let name = '';
    for (let i = 0; i < 5; i++) {
      if (vowelPositions.has(i)) {
        name += VOWELS[Math.floor(Math.random() * VOWELS.length)];
      } else {
        name += CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)];
      }
    }
    name = name[0].toUpperCase() + name.slice(1);
    const initial = LETTERS[Math.floor(Math.random() * 26)];
    const fullName = `${name} ${initial}.`;
    if (!existingNames.has(fullName)) return fullName;
  }
  return `Agent ${Math.floor(Math.random() * 9999)}`;
}

export function generateInitialEmployees(count) {
  const names = new Set();
  const employees = [];
  for (let i = 0; i < count; i++) {
    const name = generateName(names);
    names.add(name);
    employees.push({
      id: i + 1,
      name,
      salary: 50000,
      role: 'Unassigned',
      status: 'Active',
      joinedWeek: 1,
    });
  }
  return employees;
}
