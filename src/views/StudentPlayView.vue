<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { api } from "@/lib/api"

type PlayActivity = {
  code: string
  student?: {
    id: number
    name: string
    class_level?: string | null
    stream?: string | null
  } | null
  activity: {
    id: number
    title: string
    description?: string | null
    grade_label?: string | null
    activity_type: string
    settings: {
      allow_nickname?: boolean
      show_feedback?: boolean
    }
    question_count: number
  }
}

type PlayQuestion = {
  number: number
  kind: string
  prompt: string
  marks: number
}

type StartedActivity = {
  attempt_id: number
  activity: {
    id: number
    title: string
    grade_label?: string | null
    settings: Record<string, any>
  }
  questions: PlayQuestion[]
}

type SubmitResult = {
  attempt_id: number
  score: number
  total: number
  percentage_score: number
  results: Array<{
    question_number: number
    answer: string
    correct_answer: string
    is_correct: boolean
  }>
}

const route = useRoute()
const router = useRouter()

const codeInput = ref("")
const lookup = ref<PlayActivity | null>(null)
const started = ref<StartedActivity | null>(null)
const result = ref<SubmitResult | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const learner = reactive({
  name: "",
})

const answers = reactive<Record<number, string>>({})
const checkedAnswers = reactive<Record<number, boolean | undefined>>({})
const activeIndex = ref(0)
const coins = ref(0)
const streak = ref(0)
const bestStreak = ref(0)
const lives = ref(3)
const message = ref("Solve the first challenge to start your streak.")

const normalizedCode = computed(() => codeInput.value.trim().toUpperCase())
const progress = computed(() => {
  if (!started.value?.questions.length) return 0
  const answered = started.value.questions.filter((question) => checkedAnswers[question.number] !== undefined).length
  return Math.round((answered / started.value.questions.length) * 100)
})
const activeQuestion = computed(() => started.value?.questions[activeIndex.value] ?? null)
const answeredCount = computed(() => {
  return started.value?.questions.filter((question) => checkedAnswers[question.number] !== undefined).length ?? 0
})
const correctCount = computed(() => {
  return started.value?.questions.filter((question) => checkedAnswers[question.number] === true).length ?? 0
})
const questionStatus = computed(() => {
  if (!activeQuestion.value) return null
  return checkedAnswers[activeQuestion.value.number]
})
const gameComplete = computed(() => Boolean(started.value?.questions.length && answeredCount.value === started.value.questions.length))
const rankLabel = computed(() => {
  const score = result.value?.percentage_score ?? Math.round((correctCount.value / Math.max(1, started.value?.questions.length ?? 1)) * 100)
  if (score >= 90) return "Math Champion"
  if (score >= 75) return "Fact Master"
  if (score >= 50) return "Strategy Builder"
  return "Keep Practicing"
})

async function findCode(code = normalizedCode.value) {
  if (!code) return
  loading.value = true
  error.value = null
  result.value = null
  started.value = null
  try {
    lookup.value = await api<PlayActivity>(`math/play/${encodeURIComponent(code)}`, "GET")
    codeInput.value = lookup.value.code
    learner.name = lookup.value.student?.name || learner.name
    if (route.params.code !== lookup.value.code) {
      await router.replace({ name: "student-play-code", params: { code: lookup.value.code } })
    }
  } catch (err: any) {
    lookup.value = null
    error.value = err?.message || "Code not found"
  } finally {
    loading.value = false
  }
}

async function startActivity() {
  if (!lookup.value) return
  loading.value = true
  error.value = null
  try {
    started.value = await api<StartedActivity>(`math/play/${encodeURIComponent(lookup.value.code)}/start`, "POST", {
      body: { learner_name: learner.name },
    })
    for (const question of started.value.questions) {
      answers[question.number] = ""
      checkedAnswers[question.number] = undefined
    }
    activeIndex.value = 0
    coins.value = 0
    streak.value = 0
    bestStreak.value = 0
    lives.value = 3
    message.value = "Solve the first challenge to start your streak."
  } catch (err: any) {
    error.value = err?.message || "Could not start activity"
  } finally {
    loading.value = false
  }
}

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace("×", "x")
}

function locallyExpectedAnswer(question: PlayQuestion) {
  const arithmetic = question.prompt.match(/(-?\d+(?:\.\d+)?)\s*(?:x|×)\s*(-?\d+(?:\.\d+)?)/i)
  if (arithmetic) {
    const left = Number(arithmetic[1])
    const right = Number(arithmetic[2])
    if (Number.isFinite(left) && Number.isFinite(right)) return String(left * right)
  }
  const missing = question.prompt.match(/(-?\d+)?\s*_+\s*(?:x|×)\s*(-?\d+)\s*=\s*(-?\d+)/i)
  if (missing) {
    const known = Number(missing[2])
    const product = Number(missing[3])
    if (Number.isFinite(known) && known !== 0 && Number.isFinite(product)) return String(product / known)
  }
  const array = question.prompt.match(/array has\s+(\d+)\s+rows\s+and\s+(\d+)\s+columns/i)
  if (array) return String(Number(array[1]) * Number(array[2]))
  return null
}

function checkCurrentAnswer() {
  const question = activeQuestion.value
  if (!question) return
  const answer = answers[question.number] || ""
  if (!answer.trim()) {
    message.value = "Enter an answer first."
    return
  }
  const expected = locallyExpectedAnswer(question)
  const isCorrect = expected ? normalizeAnswer(answer) === normalizeAnswer(expected) : true
  checkedAnswers[question.number] = isCorrect
  if (isCorrect) {
    streak.value += 1
    bestStreak.value = Math.max(bestStreak.value, streak.value)
    coins.value += 10 + Math.min(streak.value, 5) * 2
    message.value = streak.value >= 3 ? `Correct. ${streak.value} in a row.` : "Correct. Keep going."
  } else {
    streak.value = 0
    lives.value = Math.max(0, lives.value - 1)
    message.value = lives.value > 0 ? "Not quite. Try the next one carefully." : "No lives left, but finish strong."
  }
}

function goNext() {
  if (!started.value) return
  activeIndex.value = Math.min(started.value.questions.length - 1, activeIndex.value + 1)
  const nextQuestion = started.value.questions[activeIndex.value]
  message.value = nextQuestion && checkedAnswers[nextQuestion.number] === undefined
    ? "New challenge ready."
    : "Review this challenge or move again."
}

function goPrevious() {
  activeIndex.value = Math.max(0, activeIndex.value - 1)
}

async function submitActivity() {
  if (!lookup.value || !started.value) return
  loading.value = true
  error.value = null
  try {
    result.value = await api<SubmitResult>(`math/play/${encodeURIComponent(lookup.value.code)}/submit`, "POST", {
      body: {
        attempt_id: started.value.attempt_id,
        answers: started.value.questions.map((question) => ({
          question_number: question.number,
          answer: answers[question.number] || "",
        })),
      },
    })
  } catch (err: any) {
    error.value = err?.message || "Could not submit answers"
  } finally {
    loading.value = false
  }
}

function resultFor(questionNumber: number) {
  return result.value?.results.find((item) => item.question_number === questionNumber)
}

onMounted(() => {
  const routeCode = typeof route.params.code === "string" ? route.params.code : ""
  if (routeCode) {
    codeInput.value = routeCode
    void findCode(routeCode)
  }
})
</script>

<template>
  <section class="play-page">
    <div class="play-shell">
      <header class="play-header">
        <p class="eyebrow">Student Play</p>
        <h1>Enter your math code</h1>
        <p class="subtle">Use the code your teacher gave you to start the activity.</p>
      </header>

      <p v-if="error" class="error">{{ error }}</p>

      <form v-if="!lookup && !started" class="join-card" @submit.prevent="findCode()">
        <label>
          <span>Activity code</span>
          <input v-model="codeInput" autocomplete="off" inputmode="text" placeholder="ABC-123" />
        </label>
        <button class="primary" type="submit" :disabled="loading">{{ loading ? "Checking..." : "Continue" }}</button>
      </form>

      <section v-if="lookup && !started" class="join-card">
        <div>
          <p class="eyebrow">{{ lookup.activity.grade_label }}</p>
          <h2>{{ lookup.activity.title }}</h2>
          <p class="subtle">{{ lookup.activity.description }}</p>
        </div>
        <div class="activity-meta">
          <span>{{ lookup.activity.question_count }} questions</span>
          <span>{{ lookup.activity.activity_type }}</span>
          <span>Code {{ lookup.code }}</span>
        </div>
        <div v-if="lookup.student" class="assigned-student">
          <span>Assigned to</span>
          <strong>{{ lookup.student.name }}</strong>
          <span>{{ lookup.student.class_level }}{{ lookup.student.stream ? ` · ${lookup.student.stream}` : "" }}</span>
        </div>
        <label v-else-if="lookup.activity.settings.allow_nickname">
          <span>Your name</span>
          <input v-model="learner.name" autocomplete="name" placeholder="Write your name" />
        </label>
        <button class="primary" type="button" :disabled="loading" @click="startActivity">
          {{ loading ? "Starting..." : "Start activity" }}
        </button>
      </section>

      <section v-if="started" class="activity-card">
        <header class="activity-header">
          <div>
            <p class="eyebrow">{{ started.activity.grade_label }}</p>
            <h2>{{ started.activity.title }}</h2>
          </div>
          <div class="hud">
            <div class="hud-item">
              <strong>{{ coins }}</strong>
              <span>coins</span>
            </div>
            <div class="hud-item">
              <strong>{{ streak }}</strong>
              <span>streak</span>
            </div>
            <div class="hud-item lives">
              <strong>{{ "♥".repeat(lives) || "0" }}</strong>
              <span>lives</span>
            </div>
          </div>
        </header>

        <div v-if="!result" class="game-panel">
          <div class="progress-track">
            <span :style="{ width: `${progress}%` }"></span>
          </div>
          <div class="game-message">{{ message }}</div>

          <article v-if="activeQuestion" :class="questionStatus === true ? 'challenge-card correct' : questionStatus === false ? 'challenge-card wrong' : 'challenge-card'">
            <div class="challenge-top">
              <span class="question-number">{{ activeQuestion.number }}</span>
              <span class="kind-pill">{{ activeQuestion.kind }}</span>
              <span>{{ activeIndex + 1 }} / {{ started.questions.length }}</span>
            </div>
            <h3>{{ activeQuestion.prompt }}</h3>
            <input
              v-model="answers[activeQuestion.number]"
              autocomplete="off"
              inputmode="decimal"
              placeholder="Type your answer"
              :disabled="questionStatus !== undefined"
              @keyup.enter="questionStatus === undefined ? checkCurrentAnswer() : goNext()"
            />
            <div class="challenge-actions">
              <button class="ghost" type="button" :disabled="activeIndex === 0" @click="goPrevious">Previous</button>
              <button v-if="questionStatus === undefined" class="primary" type="button" @click="checkCurrentAnswer">Check</button>
              <button v-else class="primary" type="button" :disabled="activeIndex === started.questions.length - 1" @click="goNext">
                Next
              </button>
            </div>
          </article>

          <div class="question-map">
            <button
              v-for="(question, index) in started.questions"
              :key="question.number"
              :class="checkedAnswers[question.number] === true ? 'map-dot correct' : checkedAnswers[question.number] === false ? 'map-dot wrong' : index === activeIndex ? 'map-dot active' : 'map-dot'"
              type="button"
              @click="activeIndex = index"
            >
              {{ question.number }}
            </button>
          </div>
        </div>

        <div v-else class="results-panel">
          <div class="score-card">
            <span>{{ rankLabel }}</span>
            <strong>{{ result.score }} / {{ result.total }}</strong>
            <span>{{ result.percentage_score }}% · {{ coins }} coins · best streak {{ bestStreak }}</span>
          </div>
          <div class="result-list">
            <div
              v-for="question in started.questions"
              :key="question.number"
              :class="resultFor(question.number)?.is_correct ? 'result-row correct' : 'result-row'"
            >
              <span>{{ question.number }}. {{ question.prompt }}</span>
              <strong>{{ resultFor(question.number)?.is_correct ? "Correct" : `Answer: ${resultFor(question.number)?.correct_answer}` }}</strong>
            </div>
          </div>
        </div>

        <button v-if="!result" class="primary submit-button" type="button" :disabled="loading || !gameComplete" @click="submitActivity">
          {{ loading ? "Submitting..." : gameComplete ? "Finish game" : `Answer ${started.questions.length - answeredCount} more` }}
        </button>
      </section>
    </div>
  </section>
</template>

<style scoped>
.play-page {
  min-height: calc(100vh - 180px);
  display: grid;
  place-items: start center;
}

.play-shell {
  width: min(920px, 100%);
  display: grid;
  gap: 1rem;
}

.play-header,
.join-card,
.activity-card {
  background: var(--card-bg);
  border: 1px solid var(--border-soft);
  border-radius: 18px;
  padding: 1.5rem;
  box-shadow: 0 16px 34px rgba(29, 31, 27, 0.07);
}

.play-header h1,
.join-card h2,
.activity-header h2 {
  margin: 0.25rem 0;
  font-family: "Source Serif 4", serif;
}

.join-card {
  display: grid;
  gap: 1rem;
}

label {
  display: grid;
  gap: 0.45rem;
  color: var(--ink-muted);
}

input {
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  background: #fafbfa;
  color: var(--ink-strong);
  padding: 0.8rem 0.9rem;
  font: inherit;
}

.join-card input {
  font-size: 1.2rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.activity-meta {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.activity-meta span {
  border: 1px solid var(--border-soft);
  border-radius: 999px;
  padding: 0.35rem 0.7rem;
  color: var(--ink-muted);
}

.assigned-student {
  display: grid;
  gap: 0.2rem;
  border: 1px solid var(--border-soft);
  border-radius: 14px;
  padding: 0.9rem;
  background: var(--accent-soft);
}

.assigned-student span {
  color: var(--ink-muted);
}

.activity-card {
  display: grid;
  gap: 1rem;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.hud {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.hud-item {
  min-width: 76px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: var(--accent-soft);
  color: var(--accent);
  padding: 0.65rem 0.8rem;
}

.hud-item strong {
  font-size: 1.2rem;
}

.hud-item span {
  font-size: 0.75rem;
  color: var(--ink-muted);
}

.hud-item.lives {
  color: var(--accent-2);
  background: var(--accent-2-soft);
}

.game-panel {
  display: grid;
  gap: 1rem;
}

.progress-track {
  height: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(29, 31, 27, 0.08);
}

.progress-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--accent), var(--accent-2));
  transition: width 0.25s ease;
}

.game-message {
  border: 1px solid var(--border-soft);
  border-radius: 14px;
  background: #fafbf8;
  padding: 0.75rem 0.9rem;
  color: var(--ink-muted);
}

.challenge-card {
  position: relative;
  border: 1px solid var(--border-soft);
  border-radius: 18px;
  padding: 1.25rem;
  background: #fff;
  color: var(--ink-strong);
  display: grid;
  gap: 1rem;
}

.challenge-card.correct {
  border-color: rgba(47, 107, 79, 0.45);
  background: #f0f7f2;
}

.challenge-card.wrong {
  border-color: rgba(201, 107, 60, 0.45);
  background: #fff8f5;
}

.challenge-top,
.challenge-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.challenge-card h3 {
  margin: 0;
  font-size: 1.35rem;
  line-height: 1.35;
}

.kind-pill {
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  padding: 0.3rem 0.65rem;
  font-size: 0.8rem;
}

.question-number {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 700;
}

.question-map {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.map-dot {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid var(--border-soft);
  background: #fff;
  color: var(--ink-muted);
  cursor: pointer;
}

.map-dot.active {
  border-color: var(--accent);
  color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.map-dot.correct {
  background: var(--accent);
  color: #fff;
}

.map-dot.wrong {
  background: var(--accent-2);
  color: #fff;
}

.submit-button {
  justify-self: end;
}

.results-panel {
  display: grid;
  gap: 1rem;
}

.score-card {
  display: grid;
  place-items: center;
  gap: 0.25rem;
  background: var(--accent-soft);
  color: var(--accent);
  border-radius: 16px;
  padding: 1.25rem;
}

.score-card strong {
  font-size: 2rem;
}

.result-list {
  display: grid;
  gap: 0.5rem;
}

.result-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  padding: 0.8rem;
  background: #fff8f5;
}

.result-row.correct {
  background: #f0f7f2;
}

@media (max-width: 640px) {
  .activity-header,
  .challenge-top,
  .challenge-actions,
  .result-row {
    flex-direction: column;
  }

  .submit-button {
    justify-self: stretch;
  }
}
</style>
