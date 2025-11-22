const lastWeekDate = '2025-11-16'

export const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Rear Delts',
  'Side Delts',
  'Triceps',
  'Biceps',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Abs',
  'Core',
  'Full Body',
]

const RAW_EXERCISES = {
  warmup_mobility: {
    id: 'warmup_mobility',
    name: 'Dynamic Warm-up',
    equipment: 'Bodyweight + bands',
    muscleGroups: ['Full Body'],
    lastSession: [],
    targetNotes:
      'Keep heart rate around 120 bpm and focus on shoulder circles, band pull-aparts, and ankle mobility for 8–10 minutes.',
    cues: [
      'Start with light cardio (jumping jacks) before moving joints through active ranges.',
      'Jeff Nippard recommends “movement-specific” warm-up, so mimic the pressing and pulling angles you will use later.',
    ],
    mistakes: ['Skipping warm-up or rushing through mobility drills.'],
    restSeconds: 0,
    swapSuggestions: [
      {
        name: 'Rowing machine (5 min)',
        detail: 'Great if you need more back activation before pull-ups.',
      },
      { name: 'Assault bike 3×30s', detail: 'Add if you want extra conditioning.' },
    ],
  },
  pushups_standard: {
    id: 'pushups_standard',
    name: 'Push-ups',
    equipment: 'Bodyweight / floor',
    muscleGroups: ['Chest', 'Triceps', 'Core'],
    lastSession: [
      { set: 1, weight: 'BW', reps: 12 },
      { set: 2, weight: 'BW', reps: 12 },
      { set: 3, weight: 'BW', reps: 12 },
    ],
    lastPerformedOn: lastWeekDate,
    targetNotes: 'Aim to add a slow eccentric or elevate feet for a harder variation if all sets felt easy.',
    cues: [
      'Hands slightly outside shoulder width, screw palms into the floor.',
      'Keep ribs tucked and glutes tight to prevent sagging.',
    ],
    mistakes: ['Letting elbows flare past 60°', 'Hips sagging or piked up'],
    restSeconds: 60,
    swapSuggestions: [
      { name: 'Smith machine push-ups', detail: 'Adjust bar height if floor space is busy.' },
      { name: 'Incline dumbbell press', detail: 'Great if you want to load the movement instead.' },
    ],
  },
  bench_press_barbell: {
    id: 'bench_press_barbell',
    name: 'Barbell Bench Press',
    equipment: 'Flat bench + barbell',
    muscleGroups: ['Chest', 'Triceps', 'Front Delts'],
    lastSession: [
      { set: 1, weight: 40, reps: 12 },
      { set: 2, weight: 45, reps: 10 },
      { set: 3, weight: 50, reps: 8 },
    ],
    lastPerformedOn: lastWeekDate,
    targetNotes: 'Add 2.5 kg to the top set or push for +1 rep while maintaining bar speed.',
    cues: [
      'Retract scapula, drive feet into the floor (Jeff’s “full-body bench”).',
      'Lower with control for ~2 seconds, slight pause, then press hard.',
    ],
    mistakes: ['Bouncing off the chest', 'Losing leg drive', 'Not keeping wrists stacked.'],
    restSeconds: 150,
    swapSuggestions: [
      { name: 'Smith machine bench', detail: 'Use if the main bench is occupied.' },
      { name: 'Dumbbell bench press', detail: 'Great for unilateral balance and shoulder comfort.' },
    ],
  },
  assisted_pullup: {
    id: 'assisted_pullup',
    name: 'Assisted Pull-ups',
    equipment: 'Assisted chin-up machine',
    muscleGroups: ['Back', 'Biceps'],
    lastSession: [
      { set: 1, weight: '-35', reps: 8 },
      { set: 2, weight: '-30', reps: 8 },
    ],
    lastPerformedOn: lastWeekDate,
    targetNotes: 'Reduce assistance by ~5 kg or hold the top for 2 s each rep.',
    cues: [
      'Think “pull elbows to ribs.”',
      'Keep chest tall and avoid swinging—use the foot plate lightly.',
    ],
    mistakes: ['Letting shoulders shrug up', 'Half range of motion'],
    restSeconds: 120,
    swapSuggestions: [
      { name: 'Lat pulldown (wide grip)', detail: 'Use if the assisted machine is taken.' },
      { name: 'Band-assisted pull-ups', detail: 'Bring your own band for flexibility.' },
    ],
  },
  lat_pulldown: {
    id: 'lat_pulldown',
    name: 'Lat Pulldown',
    equipment: 'Cable tower',
    muscleGroups: ['Lats', 'Upper Back'],
    lastSession: [
      { set: 1, weight: 25, reps: 12 },
      { set: 2, weight: 30, reps: 10 },
      { set: 3, weight: 35, reps: 8 },
    ],
    lastPerformedOn: lastWeekDate,
    targetNotes: 'Match last week then add +2.5 kg to the final set or focus on 1-second squeezes.',
    cues: [
      'Slight lean back with chest proud.',
      'Drive elbows down and think “pull the bar to your sternum.”',
    ],
    mistakes: ['Rocking body excessively', 'Stopping short of chest level'],
    restSeconds: 90,
    swapSuggestions: [
      { name: 'Single-arm cable pulldown', detail: 'Great for focusing on lat stretch.' },
      { name: 'Straight-arm pulldown', detail: 'Use as a finisher if main stack busy.' },
    ],
  },
  smith_shoulder_press: {
    id: 'smith_shoulder_press',
    name: 'Smith Machine Shoulder Press',
    equipment: 'Smith machine',
    muscleGroups: ['Shoulders', 'Triceps'],
    lastSession: [
      { set: 1, weight: 20, reps: 10 },
      { set: 2, weight: 25, reps: 8 },
      { set: 3, weight: 25, reps: 8 },
    ],
    lastPerformedOn: lastWeekDate,
    targetNotes: 'Try to keep RIR (reps in reserve) at ~2. Add 2.5 kg if last week felt smooth.',
    cues: ['Stack wrists over elbows', 'Drive head through at the top', 'Control tempo 2-1-1'],
    mistakes: ['Pressing too low (toward chest)', 'Arching lower back excessively'],
    restSeconds: 120,
    swapSuggestions: [
      { name: 'Dumbbell seated press', detail: 'If Smith is taken, grab DBs.' },
      { name: 'Arnold press', detail: 'Adds more front delt involvement.' },
    ],
  },
  tricep_rope_pushdown: {
    id: 'tricep_rope_pushdown',
    name: 'Tricep Rope Pushdown',
    equipment: 'Cable tower',
    muscleGroups: ['Triceps'],
    lastSession: [
      { set: 1, weight: 15, reps: 12 },
      { set: 2, weight: 20, reps: 10 },
      { set: 3, weight: 25, reps: 8 },
    ],
    lastPerformedOn: lastWeekDate,
    targetNotes: 'Hold the peak contraction for a full second each rep before adding load.',
    cues: ['Lock elbows by your sides', 'Flare rope at the bottom'],
    mistakes: ['Letting elbows drift forward', 'Using too much torso momentum'],
    restSeconds: 75,
    swapSuggestions: [
      { name: 'Overhead cable extension', detail: 'Great long-head emphasis.' },
      { name: 'Dip machine', detail: 'Use if cables are packed.' },
    ],
  },
  db_biceps_curl: {
    id: 'db_biceps_curl',
    name: 'Dumbbell Biceps Curl',
    equipment: 'Dumbbells',
    muscleGroups: ['Biceps'],
    lastSession: [
      { set: 1, weight: 5, reps: 12 },
      { set: 2, weight: 7.5, reps: 10 },
      { set: 3, weight: 10, reps: 8 },
    ],
    lastPerformedOn: lastWeekDate,
    targetNotes: 'Try to hit +1 rep on the top set or slow the eccentric to 3 seconds.',
    cues: ['Pin elbows to ribs', 'Rotate pinkies up at the top'],
    mistakes: ['Swinging torso', 'Not fully extending elbows'],
    restSeconds: 60,
    swapSuggestions: [
      { name: 'Hammer curls', detail: 'Keeps forearms happier if wrists ache.' },
      { name: 'Cable curls (rope)', detail: 'Constant tension alternative.' },
    ],
  },
  bodyweight_squat: {
    id: 'bodyweight_squat',
    name: 'Bodyweight Squats',
    equipment: 'Bodyweight',
    muscleGroups: ['Quads', 'Glutes'],
    lastSession: [
      { set: 1, weight: 'BW', reps: 40 },
      { set: 2, weight: 'BW', reps: 30 },
      { set: 3, weight: 'BW', reps: 30 },
    ],
    lastPerformedOn: lastWeekDate,
    targetNotes: 'Add tempo (3-1-1) or hold a 10 kg plate goblet-style for added challenge.',
    cues: ['Push knees out', 'Keep whole foot planted'],
    mistakes: ['Collapsing knees inward'],
    restSeconds: 60,
    swapSuggestions: [
      { name: 'Goblet squat', detail: 'Use if you want load without barbell setup.' },
      { name: 'Leg press warm-up', detail: 'Hop on leg press for light sets.' },
    ],
  },
  seated_leg_curl: {
    id: 'seated_leg_curl',
    name: 'Seated Leg Curl',
    equipment: 'Leg curl machine',
    muscleGroups: ['Hamstrings'],
    lastSession: [
      { set: 1, weight: 30, reps: 12 },
      { set: 2, weight: 40, reps: 10 },
      { set: 3, weight: 50, reps: 8 },
    ],
    lastPerformedOn: lastWeekDate,
    targetNotes: 'Keep hips glued to the pad and pause in the shortened position.',
    cues: ['Dorsiflex toes to engage hamstrings harder'],
    mistakes: ['Letting hips lift off pad'],
    restSeconds: 90,
    swapSuggestions: [
      { name: 'Lying leg curl', detail: 'Same machine family—use whichever is free.' },
      { name: 'Smith RDL', detail: 'If curl machines are busy, hinge instead.' },
    ],
  },
  barbell_squat: {
    id: 'barbell_squat',
    name: 'Barbell Back Squat',
    equipment: 'Squat rack',
    muscleGroups: ['Quads', 'Glutes'],
    lastSession: [
      { set: 1, weight: 10, reps: 10 },
      { set: 2, weight: 15, reps: 8 },
      { set: 3, weight: 20, reps: 6 },
    ],
    lastPerformedOn: lastWeekDate,
    targetNotes: 'Add 2.5 kg to each side on the top set if depth stayed solid.',
    cues: ['Big breath + brace, sit between your heels'],
    mistakes: ['Heels lifting', 'Knees caving'],
    restSeconds: 150,
    swapSuggestions: [
      { name: 'Smith squat', detail: 'Use if rack is busy.' },
      { name: 'Leg press', detail: 'Great hypertrophy backup.' },
    ],
  },
  lying_leg_curl: {
    id: 'lying_leg_curl',
    name: 'Lying Leg Curl',
    equipment: 'Leg curl machine',
    muscleGroups: ['Hamstrings'],
    lastSession: [
      { set: 1, weight: 15, reps: 12 },
      { set: 2, weight: 20, reps: 10 },
      { set: 3, weight: 25, reps: 8 },
    ],
    lastPerformedOn: lastWeekDate,
    targetNotes: 'Drive hips into the pad and imagine performing a leg drive.',
    cues: ['Lead with heels, squeeze glutes at the top'],
    mistakes: ['Arching lower back'],
    restSeconds: 90,
    swapSuggestions: [
      { name: 'Swiss ball leg curl', detail: 'Bodyweight option if machines all busy.' },
    ],
  },
  standing_calf_raise: {
    id: 'standing_calf_raise',
    name: 'Standing Calf Raise',
    equipment: 'Bodyweight or machine',
    muscleGroups: ['Calves'],
    lastSession: [
      { set: 1, weight: 'BW', reps: 24 },
      { set: 2, weight: 'BW', reps: 24 },
      { set: 3, weight: 'BW', reps: 24 },
    ],
    lastPerformedOn: lastWeekDate,
    targetNotes: 'Add a pause at the bottom and top or hold a 10 kg plate.',
    cues: ['Think “up fast, down slow”'],
    mistakes: ['Short ROM', 'Bouncing'],
    restSeconds: 60,
    swapSuggestions: [
      { name: 'Leg press calf raise', detail: 'Load heavier while keeping balance.' },
    ],
  },
  decline_crunch: {
    id: 'decline_crunch',
    name: 'Decline Crunch',
    equipment: 'Decline bench',
    muscleGroups: ['Abs'],
    lastSession: [
      { set: 1, weight: 'BW', reps: 15 },
      { set: 2, weight: 10, reps: 12 },
      { set: 3, weight: 15, reps: 10 },
    ],
    lastPerformedOn: lastWeekDate,
    targetNotes: 'Keep rib-to-hip crunch and exhale at the top. Add 2.5 kg when all sets hit 15 reps.',
    cues: ['Roll spine segment by segment'],
    mistakes: ['Pulling on neck'],
    restSeconds: 45,
    swapSuggestions: [
      { name: 'Hanging knee raise', detail: 'Use if decline bench is taken.' },
    ],
  },
  incline_bench_press: {
    id: 'incline_bench_press',
    name: 'Incline Bench Press',
    equipment: 'Bench + barbell',
    muscleGroups: ['Chest', 'Shoulders'],
    lastSession: [
      { set: 1, weight: 40, reps: 12 },
      { set: 2, weight: 50, reps: 10 },
      { set: 3, weight: 55, reps: 8 },
    ],
    lastPerformedOn: lastWeekDate,
    targetNotes: 'Micro-load with 1.25 kg plates or push for +1 rep.',
    cues: ['15–20° incline only (Jeff cue)'],
    mistakes: ['Using too steep incline and turning it into shoulders'],
    restSeconds: 150,
    swapSuggestions: [
      { name: 'Smith incline press', detail: 'Great if barbell bench is taken.' },
      { name: 'Incline dumbbell press', detail: 'Joints feel friendlier.' },
    ],
  },
  pec_deck_fly: {
    id: 'pec_deck_fly',
    name: 'Pec Deck Fly',
    equipment: 'Pec deck machine',
    muscleGroups: ['Chest'],
    lastSession: [
      { set: 1, weight: 20, reps: 12 },
      { set: 2, weight: 25, reps: 10 },
      { set: 3, weight: 30, reps: 10 },
    ],
    lastPerformedOn: lastWeekDate,
    targetNotes: 'Squeeze for two seconds and keep shoulders depressed.',
    cues: ['Elbows slightly bent but fixed'],
    mistakes: ['Letting shoulders roll forward'],
    restSeconds: 75,
    swapSuggestions: [
      { name: 'Cable fly (high-to-low)', detail: 'Use cable stack as needed.' },
    ],
  },
  seated_cable_row: {
    id: 'seated_cable_row',
    name: 'Seated Cable Row (rope)',
    equipment: 'Cable row station',
    muscleGroups: ['Back'],
    lastSession: [
      { set: 1, weight: 35, reps: 12 },
      { set: 2, weight: 40, reps: 10 },
      { set: 3, weight: 45, reps: 8 },
    ],
    lastPerformedOn: lastWeekDate,
    targetNotes: 'Keep neutral spine and squeeze shoulder blades.',
    cues: ['Drag elbows back in a straight line', 'Slight pause with lats contracted'],
    mistakes: ['Rounding lower back'],
    restSeconds: 90,
    swapSuggestions: [
      { name: 'Chest-supported row', detail: 'Use dumbbells if cable busy.' },
    ],
  },
  reverse_pec_deck: {
    id: 'reverse_pec_deck',
    name: 'Reverse Pec Deck',
    equipment: 'Pec deck machine',
    muscleGroups: ['Rear Delts'],
    lastSession: [
      { set: 1, weight: 15, reps: 15 },
      { set: 2, weight: 20, reps: 12 },
      { set: 3, weight: 20, reps: 12 },
    ],
    lastPerformedOn: lastWeekDate,
    targetNotes: 'Stay in the 12–20 rep range and chase the burn.',
    cues: ['Lead with elbows, not hands'],
    mistakes: ['Shrugging traps'],
    restSeconds: 60,
    swapSuggestions: [
      { name: 'Cable face pull', detail: 'If machine is busy, face pulls hit the same area.' },
    ],
  },
  face_pull: {
    id: 'face_pull',
    name: 'Face Pull',
    equipment: 'Cable + rope',
    muscleGroups: ['Rear Delts', 'Upper Back'],
    lastSession: [
      { set: 1, weight: 15, reps: 15 },
      { set: 2, weight: 15, reps: 15 },
      { set: 3, weight: 20, reps: 12 },
    ],
    lastPerformedOn: lastWeekDate,
    targetNotes: 'Use chest height pulley and externally rotate hard.',
    cues: ['Pull rope to nose/eyes', 'Spread rope apart at the end'],
    mistakes: ['Letting elbows drop'],
    restSeconds: 60,
    swapSuggestions: [
      { name: 'Band face pull', detail: 'Carry a band for a quick setup.' },
    ],
  },
  lateral_raise: {
    id: 'lateral_raise',
    name: 'Dumbbell Lateral Raise',
    equipment: 'Dumbbells',
    muscleGroups: ['Side Delts'],
    lastSession: [
      { set: 1, weight: 7.5, reps: 15 },
    ],
    lastPerformedOn: lastWeekDate,
    targetNotes: 'Work up to 2 working sets once you can get 20 clean reps.',
    cues: ['Lead with elbows, slight torso lean'],
    mistakes: ['Shrugging traps', 'Swinging weight'],
    restSeconds: 45,
    swapSuggestions: [
      { name: 'Cable lateral raise', detail: 'Constant tension option.' },
    ],
  },
  db_overhead_triceps: {
    id: 'db_overhead_triceps',
    name: 'DB Overhead Tricep Extension',
    equipment: 'Dumbbells',
    muscleGroups: ['Triceps'],
    lastSession: [
      { set: 1, weight: 12.5, reps: 12 },
      { set: 2, weight: 15, reps: 10 },
      { set: 3, weight: 17.5, reps: 8 },
    ],
    lastPerformedOn: lastWeekDate,
    targetNotes: 'Keep elbows narrow and chase a big stretch.',
    cues: ['Lower until forearms touch biceps'],
    mistakes: ['Flaring elbows wide'],
    restSeconds: 75,
    swapSuggestions: [
      { name: 'EZ-bar overhead extension', detail: 'Use if dumbbells are scattered.' },
    ],
  },
  hammer_curl: {
    id: 'hammer_curl',
    name: 'Hammer Curl',
    equipment: 'Dumbbells',
    muscleGroups: ['Biceps', 'Forearms'],
    lastSession: [
      { set: 1, weight: 10, reps: 12 },
      { set: 2, weight: 12.5, reps: 10 },
      { set: 3, weight: 15, reps: 8 },
    ],
    lastPerformedOn: lastWeekDate,
    targetNotes: 'Try alternating arms with a 1-second pause at top.',
    cues: ['Thumbs toward ceiling'],
    mistakes: ['Swinging'],
    restSeconds: 60,
    swapSuggestions: [
      { name: 'Cable rope hammer curl', detail: 'Keeps tension high.' },
    ],
  },
  leg_extension: {
    id: 'leg_extension',
    name: 'Seated Leg Extension',
    equipment: 'Leg extension machine',
    muscleGroups: ['Quads'],
    lastSession: [
      { set: 1, weight: 30, reps: 15 },
      { set: 2, weight: 35, reps: 12 },
      { set: 3, weight: 40, reps: 10 },
    ],
    lastPerformedOn: lastWeekDate,
    targetNotes: 'Add a 2-second peak squeeze or increase load by 2.5 kg.',
    cues: ['Kick out fast, lower slow (Jeff’s quad cue)'],
    mistakes: ['Swinging torso back'],
    restSeconds: 75,
    swapSuggestions: [
      { name: 'Single-leg extension', detail: 'Do one leg at a time for balance.' },
    ],
  },
  smith_rdl: {
    id: 'smith_rdl',
    name: 'Smith Machine RDL',
    equipment: 'Smith machine',
    muscleGroups: ['Hamstrings', 'Glutes'],
    lastSession: [
      { set: 1, weight: 30, reps: 10 },
      { set: 2, weight: 35, reps: 8 },
      { set: 3, weight: 40, reps: 8 },
    ],
    lastPerformedOn: lastWeekDate,
    targetNotes: 'Focus on 3-second eccentrics and keep bar close to legs.',
    cues: ['Push hips back like closing a car door'],
    mistakes: ['Rounding back', 'Locking knees'],
    restSeconds: 120,
    swapSuggestions: [
      { name: 'Dumbbell RDL', detail: 'Use if Smith is busy.' },
    ],
  },
  leg_press: {
    id: 'leg_press',
    name: 'Leg Press',
    equipment: 'Leg press machine',
    muscleGroups: ['Quads', 'Glutes'],
    lastSession: [
      { set: 1, weight: 80, reps: 12 },
      { set: 2, weight: 100, reps: 10 },
      { set: 3, weight: 120, reps: 8 },
    ],
    lastPerformedOn: lastWeekDate,
    targetNotes: 'Keep depth just before hips tuck under. Add 5 kg per side when reps feel smooth.',
    cues: ['Drive through mid-foot', 'Control tempo 2-1-1'],
    mistakes: ['Locking knees at top'],
    restSeconds: 120,
    swapSuggestions: [
      { name: 'Single-leg press', detail: 'If you need more unilateral work.' },
    ],
  },
  walking_lunge: {
    id: 'walking_lunge',
    name: 'Walking Lunges',
    equipment: 'Dumbbells',
    muscleGroups: ['Quads', 'Glutes'],
    lastSession: [
      { set: 1, weight: 'BW', reps: 12 },
      { set: 2, weight: 'BW', reps: 12 },
      { set: 3, weight: 'BW', reps: 12 },
    ],
    lastPerformedOn: lastWeekDate,
    targetNotes: 'Add light dumbbells or slow eccentrics.',
    cues: ['Step long, push through front heel'],
    mistakes: ['Short steps causing knee pain'],
    restSeconds: 90,
    swapSuggestions: [
      { name: 'Reverse lunge', detail: 'Knee friendly swap.' },
    ],
  },
}

const withMuscleMeta = (exercise) => {
  const primary = exercise.primaryMuscle || exercise.muscleGroups?.[0] || 'Full Body'
  const secondary = exercise.secondaryMuscle || exercise.muscleGroups?.[1] || ''
  return {
    ...exercise,
    primaryMuscle: primary,
    secondaryMuscle: secondary,
  }
}

export const DEFAULT_EXERCISES = Object.fromEntries(
  Object.entries(RAW_EXERCISES).map(([id, value]) => [id, withMuscleMeta(value)]),
)

// Backwards-compatible export for existing callers.
export const EXERCISES = DEFAULT_EXERCISES

export const WEEK_TEMPLATE = {
  sunday: {
    label: 'Sunday',
    theme: 'Upper A',
    description: 'Push + Pull foundation day (Jeff Nippard Upper Day 1).',
    cardio: false,
    muscles: { chest: 4, back: 5, shoulders: 3, triceps: 3, biceps: 3 },
    exerciseOrder: [
      {
        slotId: 'upperA-1',
        name: 'Warm-up',
        subtitle: 'Jumping jacks + shoulder mobility',
        defaultExercise: 'warmup_mobility',
        options: ['warmup_mobility'],
      },
      {
        slotId: 'upperA-2',
        name: 'Push-ups',
        subtitle: '3 × 12',
        defaultExercise: 'pushups_standard',
        options: ['pushups_standard', 'bench_press_barbell'],
      },
      {
        slotId: 'upperA-3',
        name: 'Bench Press',
        subtitle: '3 sets · progressively heavier',
        defaultExercise: 'bench_press_barbell',
        options: ['bench_press_barbell', 'incline_bench_press', 'smith_shoulder_press'],
      },
      {
        slotId: 'upperA-4',
        name: 'Assisted Pull-ups',
        subtitle: '2 sets · 35→30 kg assist',
        defaultExercise: 'assisted_pullup',
        options: ['assisted_pullup', 'lat_pulldown'],
      },
      {
        slotId: 'upperA-5',
        name: 'Lat Pulldown',
        subtitle: '3 sets · 25/30/35 kg',
        defaultExercise: 'lat_pulldown',
        options: ['lat_pulldown', 'seated_cable_row'],
      },
      {
        slotId: 'upperA-6',
        name: 'Shoulder Press (Smith)',
        subtitle: '3 sets',
        defaultExercise: 'smith_shoulder_press',
        options: ['smith_shoulder_press', 'lateral_raise'],
      },
      {
        slotId: 'upperA-7',
        name: 'Tricep Rope Pushdown',
        subtitle: '3 sets · 15/20/25 kg',
        defaultExercise: 'tricep_rope_pushdown',
        options: ['tricep_rope_pushdown', 'db_overhead_triceps'],
      },
      {
        slotId: 'upperA-8',
        name: 'Dumbbell Bicep Curls',
        subtitle: '3 sets · 5→7.5→10 kg',
        defaultExercise: 'db_biceps_curl',
        options: ['db_biceps_curl', 'hammer_curl'],
      },
    ],
  },
  monday: {
    label: 'Monday',
    theme: 'Cardio / Run',
    cardio: true,
    description: 'Zone 2 aerobic run + optional strides. Track calories, pace, and RPE.',
    cardioPlan: {
      targetRuns: 1,
      suggestions: 'Aim for 20–30 minutes easy jogging. Keep HR < 150 bpm and finish with 4×20s strides.',
    },
  },
  tuesday: {
    label: 'Tuesday',
    theme: 'Lower A',
    cardio: false,
    description: 'Squat-dominant lower day.',
    muscles: { quads: 6, hamstrings: 6, glutes: 3, calves: 3, abs: 3 },
    exerciseOrder: [
      {
        slotId: 'lowerA-1',
        name: 'Bodyweight Squats',
        subtitle: '3 sets · 40/30/30 reps',
        defaultExercise: 'bodyweight_squat',
        options: ['bodyweight_squat', 'walking_lunge'],
      },
      {
        slotId: 'lowerA-2',
        name: 'Seated Leg Curl',
        subtitle: '3 sets · 30/40/50 kg',
        defaultExercise: 'seated_leg_curl',
        options: ['seated_leg_curl', 'lying_leg_curl', 'smith_rdl'],
      },
      {
        slotId: 'lowerA-3',
        name: 'Barbell Squats',
        subtitle: '3 sets · 10→15→20 kg plates',
        defaultExercise: 'barbell_squat',
        options: ['barbell_squat', 'leg_press', 'smith_rdl'],
      },
      {
        slotId: 'lowerA-4',
        name: 'Lying Leg Curl',
        subtitle: '3 sets · 15/20/25 kg',
        defaultExercise: 'lying_leg_curl',
        options: ['lying_leg_curl', 'seated_leg_curl', 'smith_rdl'],
      },
      {
        slotId: 'lowerA-5',
        name: 'Standing Calf Raises',
        subtitle: '3 × 24',
        defaultExercise: 'standing_calf_raise',
        options: ['standing_calf_raise', 'leg_press'],
      },
      {
        slotId: 'lowerA-6',
        name: 'Decline Crunches',
        subtitle: '3 sets · BW → 10 kg → 15 kg',
        defaultExercise: 'decline_crunch',
        options: ['decline_crunch'],
      },
    ],
  },
  wednesday: {
    label: 'Wednesday',
    theme: 'Cardio / Run',
    cardio: true,
    description: 'Intervals or tempo running to complement lower days.',
    cardioPlan: {
      targetRuns: 1,
      suggestions: '8-min warm-up jog, then 6×1 min fast / 1 min easy. Record peak pace.',
    },
  },
  thursday: {
    label: 'Thursday',
    theme: 'Upper B',
    cardio: false,
    description: 'Incline + back focus with accessory delts/arms.',
    muscles: { chest: 6, back: 6, rearDelts: 3, sideDelts: 1, triceps: 3, biceps: 3 },
    exerciseOrder: [
      {
        slotId: 'upperB-1',
        name: 'Incline Bench Press',
        subtitle: '3 sets · 40/50/55 kg',
        defaultExercise: 'incline_bench_press',
        options: ['incline_bench_press', 'bench_press_barbell', 'smith_shoulder_press'],
      },
      {
        slotId: 'upperB-2',
        name: 'Pec Deck Fly',
        subtitle: '3 sets · 20/25/30 kg',
        defaultExercise: 'pec_deck_fly',
        options: ['pec_deck_fly', 'lat_pulldown'],
      },
      {
        slotId: 'upperB-3',
        name: 'Seated Cable Row (Rope)',
        subtitle: '3 sets',
        defaultExercise: 'seated_cable_row',
        options: ['seated_cable_row', 'assisted_pullup'],
      },
      {
        slotId: 'upperB-4',
        name: 'Reverse Pec Deck (Rear Delt Fly)',
        subtitle: '3 sets',
        defaultExercise: 'reverse_pec_deck',
        options: ['reverse_pec_deck', 'face_pull'],
      },
      {
        slotId: 'upperB-5',
        name: 'Face Pulls',
        subtitle: '3 sets',
        defaultExercise: 'face_pull',
        options: ['face_pull', 'reverse_pec_deck'],
      },
      {
        slotId: 'upperB-6',
        name: 'Lateral Raise',
        subtitle: '1 set',
        defaultExercise: 'lateral_raise',
        options: ['lateral_raise', 'smith_shoulder_press'],
      },
      {
        slotId: 'upperB-7',
        name: 'DB Overhead Tricep Extension',
        subtitle: '3 sets',
        defaultExercise: 'db_overhead_triceps',
        options: ['db_overhead_triceps', 'tricep_rope_pushdown'],
      },
      {
        slotId: 'upperB-8',
        name: 'Hammer Curls',
        subtitle: '3 sets',
        defaultExercise: 'hammer_curl',
        options: ['hammer_curl', 'db_biceps_curl'],
      },
    ],
  },
  friday: {
    label: 'Friday',
    theme: 'Lower B',
    cardio: false,
    description: 'Leg extensions + hinges + unilateral work.',
    muscles: { quads: 6, hamstrings: 3, glutes: 3, calves: 3, abs: 3 },
    exerciseOrder: [
      {
        slotId: 'lowerB-1',
        name: 'Seated Leg Extension',
        subtitle: '3 sets',
        defaultExercise: 'leg_extension',
        options: ['leg_extension', 'bodyweight_squat'],
      },
      {
        slotId: 'lowerB-2',
        name: 'Smith Machine Deadlift (RDL)',
        subtitle: '3 sets',
        defaultExercise: 'smith_rdl',
        options: ['smith_rdl', 'barbell_squat', 'lying_leg_curl'],
      },
      {
        slotId: 'lowerB-3',
        name: 'Leg Press',
        subtitle: '3 sets',
        defaultExercise: 'leg_press',
        options: ['leg_press', 'barbell_squat'],
      },
      {
        slotId: 'lowerB-4',
        name: 'Calf Raises',
        subtitle: '3 sets',
        defaultExercise: 'standing_calf_raise',
        options: ['standing_calf_raise', 'leg_press'],
      },
      {
        slotId: 'lowerB-5',
        name: 'Lunges',
        subtitle: '3 sets per leg',
        defaultExercise: 'walking_lunge',
        options: ['walking_lunge', 'bodyweight_squat'],
      },
      {
        slotId: 'lowerB-6',
        name: 'Decline Crunches',
        subtitle: '3 sets',
        defaultExercise: 'decline_crunch',
        options: ['decline_crunch'],
      },
    ],
  },
  saturday: {
    label: 'Saturday',
    theme: 'Rest / Restore',
    cardio: false,
    description: 'Mobility, long walk, or low-key hobby workout. Log recovery metrics and readiness score.',
    focus: 'Sleep 8+ hours, optional stretching session.',
  },
}

export const JEFF_SET_TARGETS = {
  chest: '8–12 sets / week',
  back: '10–14 sets / week',
  shoulders: '6–10 sets / week',
  triceps: '6–8 sets / week',
  biceps: '6–8 sets / week',
  quads: '10–16 sets / week',
  hamstrings: '8–12 sets / week',
  glutes: '6–10 sets / week',
  calves: '6–8 sets / week',
  abs: '6–10 sets / week',
}

const rangePattern = /(\d+)\D+(\d+)/
const parseRange = (text) => {
  const match = text.match(rangePattern)
  if (!match) return { low: 0, high: 0 }
  return { low: Number(match[1]), high: Number(match[2]) }
}

const normalizeMuscleKey = (label) => label.toLowerCase().replace(/\s+/g, '')

export const DEFAULT_MUSCLE_TARGETS = MUSCLE_GROUPS.reduce((acc, label) => {
  const normalized = normalizeMuscleKey(label)
  const fallbackRange = '6–10 sets / week'
  const baseRange = JEFF_SET_TARGETS[normalized] || fallbackRange
  acc[label] = parseRange(baseRange)
  return acc
}, {})

export const DEFAULT_NOTES = {
  bench_press_barbell: 'Set feet first, squeeze bar before unracking.',
  lat_pulldown: 'Think elbows in pockets + hold for 1 second.',
  barbell_squat: 'Deep breath + brace on every rep.',
}
