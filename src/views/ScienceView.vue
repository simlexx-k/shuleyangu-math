<script setup lang="ts">
import { computed, reactive, ref } from "vue"
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/vue"
import { api } from "@/lib/api"

type Subject = "physics" | "chemistry" | "biology"
type SeededMcq = {
  stem: string
  options: string[]
}
type SeededShortQuestion = {
  prompt: string
  marks: number
}
type SeededStructuredPart = {
  label: string
  prompt: string
  marks: number
}
type SeededStructuredQuestion = {
  title: string
  parts: SeededStructuredPart[]
}

const tracks = [
  {
    id: "physics" as Subject,
    title: "Physics",
    overview: "Measurement, forces, energy, waves, electricity, and motion labs.",
    tools: [
      { name: "Motion Calculator", status: "Scaffolded" },
      { name: "Unit Converter", status: "Scaffolded" },
      { name: "Experiment Report Builder", status: "Planned" },
    ],
  },
  {
    id: "chemistry" as Subject,
    title: "Chemistry",
    overview: "Atoms, bonding, reactions, acids and bases, and practical investigations.",
    tools: [
      { name: "Equation Balancer", status: "Scaffolded" },
      { name: "Periodic Trends Explorer", status: "Planned" },
      { name: "Lab Safety Checklist", status: "Scaffolded" },
    ],
  },
  {
    id: "biology" as Subject,
    title: "Biology",
    overview: "Cells, body systems, ecosystems, classification, and life processes.",
    tools: [
      { name: "Cell Structure Quiz Builder", status: "Scaffolded" },
      { name: "Food Web Mapper", status: "Planned" },
      { name: "Practical Logbook Template", status: "Scaffolded" },
    ],
  },
]

const scaffold = reactive({
  subject: "physics" as Subject,
  classLevel: "Grade 8",
  topic: "Forces and Motion",
  questionCount: 8,
})

const worksheetPreview = computed(() => {
  const count = Math.max(3, Math.min(scaffold.questionCount, 20))
  const stemsBySubject: Record<Subject, string[]> = {
    physics: [
      "Define the key concept in your own words.",
      "State the SI unit and why it is used.",
      "Given values, compute the required quantity.",
      "Describe one real-world application.",
      "Interpret the result from a simple diagram.",
    ],
    chemistry: [
      "Name the reactants and products.",
      "Write and balance the equation.",
      "Classify the reaction type.",
      "State one safety precaution for this experiment.",
      "Explain observations using particle theory.",
    ],
    biology: [
      "Label the main parts in the diagram.",
      "State the function of each part.",
      "Compare two related biological structures.",
      "Predict what happens if one process is disrupted.",
      "Connect the concept to ecosystem or health impact.",
    ],
  }

  const bank = stemsBySubject[scaffold.subject]
  return Array.from({ length: count }, (_, idx) => {
    return `${idx + 1}. ${bank[idx % bank.length]}`
  })
})

const seededQuiz = {
  subject: "Science",
  topic: "Human Digestive System",
  duration: "1 Hour",
  totalMarks: 50,
  instructions: [
    "Answer ALL questions.",
    "Write neatly and clearly.",
    "Diagrams must be well labelled where required.",
  ],
  sectionA: {
    title: "SECTION A: MULTIPLE CHOICE QUESTIONS",
    marks: 10,
    instruction: "Answer ALL questions in this section.",
    questions: [
      {
        stem: "Digestion of food in human beings begins in the:",
        options: ["A. Stomach", "B. Mouth", "C. Oesophagus", "D. Ileum"],
      },
      {
        stem: "The process by which teeth break down food is called:",
        options: ["A. Peristalsis", "B. Emulsification", "C. Mastication", "D. Assimilation"],
      },
      {
        stem: "Which enzyme is found in saliva?",
        options: ["A. Pepsin", "B. Trypsin", "C. Salivary amylase", "D. Lipase"],
      },
      {
        stem: "Salivary amylase digests:",
        options: [
          "A. Proteins to peptides",
          "B. Fats to fatty acids",
          "C. Starch to maltose",
          "D. Lactose to glucose",
        ],
      },
      {
        stem: "The movement of food through the oesophagus is by:",
        options: ["A. Churning", "B. Swallowing", "C. Peristalsis", "D. Absorption"],
      },
      {
        stem: "Which acid is found in the stomach?",
        options: ["A. Lactic acid", "B. Hydrochloric acid", "C. Sulphuric acid", "D. Nitric acid"],
      },
      {
        stem: "The enzyme that digests proteins in the stomach is:",
        options: ["A. Amylase", "B. Rennin", "C. Pepsin", "D. Lipase"],
      },
      {
        stem: "Bile helps digestion by:",
        options: [
          "A. Digesting proteins",
          "B. Creating acidic conditions",
          "C. Emulsifying fats",
          "D. Digesting starch",
        ],
      },
      {
        stem: "Digestion is completed in the:",
        options: ["A. Duodenum", "B. Stomach", "C. Ileum", "D. Colon"],
      },
      {
        stem: "The removal of faeces from the body is called:",
        options: ["A. Absorption", "B. Assimilation", "C. Digestion", "D. Egestion"],
      },
    ] as SeededMcq[],
  },
  sectionB: {
    title: "SECTION B: SHORT ANSWER QUESTIONS",
    marks: 20,
    questions: [
      { prompt: "Define digestion.", marks: 2 },
      { prompt: "State two functions of saliva in the mouth.", marks: 2 },
      { prompt: "What is a bolus?", marks: 1 },
      { prompt: "State the role of the epiglottis during swallowing.", marks: 2 },
      { prompt: "Name the two sphincter muscles found in the stomach.", marks: 2 },
      { prompt: "Give two functions of hydrochloric acid in the stomach.", marks: 2 },
      { prompt: "What is chyme?", marks: 2 },
      { prompt: "Name two enzymes found in pancreatic juice and state their functions.", marks: 4 },
      { prompt: "State two functions of villi in the ileum.", marks: 2 },
      { prompt: "Name two products of digestion found in chyle.", marks: 1 },
    ] as SeededShortQuestion[],
  },
  sectionC: {
    title: "SECTION C: STRUCTURED QUESTIONS",
    marks: 20,
    questions: [
      {
        title: "Digestion in the Mouth",
        parts: [
          { label: "a", prompt: "Name the enzyme involved in digestion in the mouth.", marks: 1 },
          { label: "b", prompt: "State the type of food it digests.", marks: 1 },
          { label: "c", prompt: "Explain how digestion is aided by teeth and saliva.", marks: 4 },
        ],
      },
      {
        title: "Digestion in the Stomach",
        parts: [
          { label: "a", prompt: "Name the juice produced in the stomach.", marks: 1 },
          { label: "b", prompt: "Name two enzymes found in this juice.", marks: 2 },
          { label: "c", prompt: "State the function of each enzyme named in (b).", marks: 4 },
        ],
      },
      {
        title: "Digestion in the Small Intestine",
        parts: [
          { label: "a", prompt: "Name the part of the small intestine where food mixes with bile.", marks: 1 },
          { label: "b", prompt: "What is emulsification?", marks: 2 },
          { label: "c", prompt: "State three enzymes found in the ileum and their functions.", marks: 6 },
        ],
      },
    ] as SeededStructuredQuestion[],
  },
}

const seedPdfLoading = ref(false)
const seedPdfError = ref<string | null>(null)

async function downloadSeededQuizPdf() {
  seedPdfError.value = null
  seedPdfLoading.value = true
  try {
    const payload = {
      subject: seededQuiz.subject,
      topic: seededQuiz.topic,
      time_allowed: seededQuiz.duration,
      total_marks: seededQuiz.totalMarks,
      instructions: seededQuiz.instructions,
      section_a: {
        title: seededQuiz.sectionA.title,
        marks: seededQuiz.sectionA.marks,
        instruction: seededQuiz.sectionA.instruction,
        questions: seededQuiz.sectionA.questions.map((q) => ({
          stem: q.stem,
          options: q.options,
        })),
      },
      section_b: {
        title: seededQuiz.sectionB.title,
        marks: seededQuiz.sectionB.marks,
        questions: seededQuiz.sectionB.questions.map((q) => ({
          prompt: q.prompt,
          marks: q.marks,
        })),
      },
      section_c: {
        title: seededQuiz.sectionC.title,
        marks: seededQuiz.sectionC.marks,
        questions: seededQuiz.sectionC.questions.map((q) => ({
          title: q.title,
          parts: q.parts.map((part) => ({
            label: part.label,
            prompt: part.prompt,
            marks: part.marks,
          })),
        })),
      },
      title: `${seededQuiz.subject} Quiz - ${seededQuiz.topic}`,
    }
    const blob = await api<Blob>("math/science/quiz/pdf", "POST", {
      auth: true,
      body: payload,
      responseType: "blob",
    })
    const url = URL.createObjectURL(blob)
    const stamp = new Date().toISOString().slice(0, 10)
    const link = document.createElement("a")
    link.href = url
    link.download = `science_quiz_${stamp}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  } catch (err: any) {
    seedPdfError.value = err?.message || "Failed to generate science quiz PDF"
  } finally {
    seedPdfLoading.value = false
  }
}
</script>

<template>
  <section class="science">
    <header class="science-header">
      <div>
        <p class="eyebrow">Science Section</p>
        <h1>Science Hub (Scaffold)</h1>
        <p class="subtle">A starter section for physics, chemistry, and biology classroom tools.</p>
      </div>
    </header>

    <TabGroup>
      <TabList class="subject-tabs">
        <Tab v-for="track in tracks" :key="track.id" v-slot="{ selected }" as="template">
          <button type="button" :class="selected ? 'subject-tab active' : 'subject-tab'">{{ track.title }}</button>
        </Tab>
      </TabList>

      <TabPanels class="subject-panels">
        <TabPanel v-for="track in tracks" :key="`panel-${track.id}`" class="subject-panel">
          <section class="card">
            <h2>{{ track.title }} tools</h2>
            <p class="subtle">{{ track.overview }}</p>
            <div class="tool-list">
              <article v-for="tool in track.tools" :key="tool.name" class="tool-item">
                <span>{{ tool.name }}</span>
                <span class="pill">{{ tool.status }}</span>
              </article>
            </div>
          </section>
        </TabPanel>
      </TabPanels>
    </TabGroup>

    <section class="card">
      <h2>Worksheet Scaffold</h2>
      <p class="subtle">Draft a quick science worksheet structure while full generators are being built.</p>
      <div class="field-row">
        <label>
          <span>Subject</span>
          <select v-model="scaffold.subject">
            <option value="physics">Physics</option>
            <option value="chemistry">Chemistry</option>
            <option value="biology">Biology</option>
          </select>
        </label>
        <label>
          <span>Class level</span>
          <input v-model="scaffold.classLevel" type="text" />
        </label>
        <label>
          <span>Topic</span>
          <input v-model="scaffold.topic" type="text" />
        </label>
        <label>
          <span>Questions</span>
          <input v-model.number="scaffold.questionCount" type="number" min="3" max="20" />
        </label>
      </div>

      <div class="preview">
        <h3>{{ scaffold.classLevel }} - {{ scaffold.topic }}</h3>
        <p class="subtle">{{ scaffold.subject.toUpperCase() }} worksheet outline</p>
        <ol>
          <li v-for="line in worksheetPreview" :key="line">{{ line }}</li>
        </ol>
      </div>
    </section>

    <section class="card">
      <h2>Seeded Quiz Item</h2>
      <p class="subtle">Pilot seed for the Science Hub quiz bank.</p>
      <div class="seed-actions">
        <button class="primary" type="button" :disabled="seedPdfLoading" @click="downloadSeededQuizPdf">
          {{ seedPdfLoading ? "Preparing PDF..." : "Download Quiz PDF" }}
        </button>
      </div>
      <p v-if="seedPdfError" class="error">{{ seedPdfError }}</p>
      <div class="seed-meta">
        <span class="pill">{{ seededQuiz.subject }}</span>
        <span class="pill">{{ seededQuiz.topic }}</span>
        <span class="pill">{{ seededQuiz.duration }}</span>
        <span class="pill">{{ seededQuiz.totalMarks }} Marks</span>
      </div>
      <ul class="instructions">
        <li v-for="line in seededQuiz.instructions" :key="line">{{ line }}</li>
      </ul>

      <TabGroup>
        <TabList class="seed-tabs">
          <Tab v-slot="{ selected }" as="template">
            <button type="button" :class="selected ? 'seed-tab active' : 'seed-tab'">Section A</button>
          </Tab>
          <Tab v-slot="{ selected }" as="template">
            <button type="button" :class="selected ? 'seed-tab active' : 'seed-tab'">Section B</button>
          </Tab>
          <Tab v-slot="{ selected }" as="template">
            <button type="button" :class="selected ? 'seed-tab active' : 'seed-tab'">Section C</button>
          </Tab>
        </TabList>

        <TabPanels class="seed-panels">
          <TabPanel class="seed-panel">
            <h3>{{ seededQuiz.sectionA.title }} ({{ seededQuiz.sectionA.marks }} Marks)</h3>
            <p class="subtle">{{ seededQuiz.sectionA.instruction }}</p>
            <ol class="seed-list">
              <li v-for="(item, idx) in seededQuiz.sectionA.questions" :key="`a-${idx}`">
                <p>{{ item.stem }}</p>
                <ul class="options">
                  <li v-for="option in item.options" :key="option">{{ option }}</li>
                </ul>
              </li>
            </ol>
          </TabPanel>

          <TabPanel class="seed-panel">
            <h3>{{ seededQuiz.sectionB.title }} ({{ seededQuiz.sectionB.marks }} Marks)</h3>
            <ol class="seed-list">
              <li v-for="(item, idx) in seededQuiz.sectionB.questions" :key="`b-${idx}`" class="seed-row">
                <span>{{ item.prompt }}</span>
                <span class="mark">({{ item.marks }} marks)</span>
              </li>
            </ol>
          </TabPanel>

          <TabPanel class="seed-panel">
            <h3>{{ seededQuiz.sectionC.title }} ({{ seededQuiz.sectionC.marks }} Marks)</h3>
            <ol class="seed-list">
              <li v-for="(item, idx) in seededQuiz.sectionC.questions" :key="`c-${idx}`">
                <p><strong>{{ item.title }}</strong></p>
                <ul class="parts">
                  <li v-for="part in item.parts" :key="`${item.title}-${part.label}`" class="seed-row">
                    <span>{{ part.label }}) {{ part.prompt }}</span>
                    <span class="mark">({{ part.marks }} mark{{ part.marks > 1 ? "s" : "" }})</span>
                  </li>
                </ul>
              </li>
            </ol>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </section>
  </section>
</template>

<style scoped>
.science {
  display: grid;
  gap: 1.25rem;
}

.science-header h1 {
  margin: 0;
  font-family: "Source Serif 4", serif;
}

.subject-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  padding: 0.35rem;
  background: #edf2ea;
  border: 1px solid var(--border-soft);
  border-radius: 14px;
}

.subject-tab {
  border: 1px solid transparent;
  background: transparent;
  color: var(--ink-muted);
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 10px;
  padding: 0.65rem 0.8rem;
}

.subject-tab.active {
  background: #fff;
  border-color: var(--border-soft);
  color: var(--ink-strong);
  box-shadow: 0 6px 16px rgba(30, 31, 26, 0.08);
}

.subject-panels {
  margin-top: 0.8rem;
}

.card {
  background: var(--card-bg);
  border: 1px solid var(--border-soft);
  border-radius: 18px;
  padding: 1.25rem;
  display: grid;
  gap: 0.8rem;
}

.card h2 {
  margin: 0;
  font-family: "Source Serif 4", serif;
}

.tool-list {
  display: grid;
  gap: 0.5rem;
}

.tool-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  background: #fafbfa;
  border: 1px solid var(--border-soft);
  border-radius: 10px;
  padding: 0.6rem 0.75rem;
}

.pill {
  font-size: 0.75rem;
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  background: #eef3ed;
  color: var(--ink-muted);
}

.field-row {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

label {
  display: grid;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: var(--ink-muted);
}

input,
select {
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--border-soft);
  border-radius: 10px;
  background: #fafbfa;
  font-size: 0.95rem;
  width: 100%;
}

.preview {
  background: #fafbfa;
  border-radius: 12px;
  padding: 0.85rem 1rem;
  border: 1px solid var(--border-soft);
}

.preview h3 {
  margin: 0;
}

.preview ol {
  margin: 0.5rem 0 0;
  padding-left: 1.1rem;
}

.seed-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.seed-actions {
  display: flex;
  justify-content: flex-start;
}

.error {
  margin: 0;
}

.instructions {
  margin: 0;
  padding-left: 1.15rem;
}

.seed-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.45rem;
  padding: 0.3rem;
  background: #f1f5ef;
  border: 1px solid var(--border-soft);
  border-radius: 12px;
}

.seed-tab {
  border: 1px solid transparent;
  border-radius: 9px;
  background: transparent;
  color: var(--ink-muted);
  padding: 0.5rem 0.6rem;
  font-size: 0.85rem;
  font-weight: 600;
}

.seed-tab.active {
  background: #fff;
  border-color: var(--border-soft);
  color: var(--ink-strong);
}

.seed-panels {
  margin-top: 0.7rem;
}

.seed-panel h3 {
  margin: 0;
  font-size: 0.95rem;
}

.seed-list {
  margin: 0.45rem 0 0;
  padding-left: 1.1rem;
  display: grid;
  gap: 0.55rem;
}

.options,
.parts {
  margin: 0.3rem 0 0;
  padding-left: 1rem;
  display: grid;
  gap: 0.2rem;
}

.seed-row {
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
}

.mark {
  white-space: nowrap;
  color: var(--ink-muted);
}

@media (max-width: 720px) {
  .subject-tabs {
    grid-template-columns: 1fr;
  }

  .seed-tabs {
    grid-template-columns: 1fr;
  }

  .seed-row {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>
