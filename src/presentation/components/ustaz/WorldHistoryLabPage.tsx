import { BasicSubjectLabPage } from "./BasicSubjectLabPage";

const FORMULAS = [
  { text: "476 — Рим империясы", top: "8%", left: "4%" },
  { text: "1492 — Америка", top: "18%", right: "6%" },
  { text: "1789 — Франция", top: "42%", left: "2%" },
  { text: "1914–1918", top: "55%", right: "3%" },
  { text: "1945 — Екінші дүниежүзілік", top: "72%", left: "8%" },
  { text: "XXI ғ.", top: "85%", right: "10%" },
];

export function WorldHistoryLabPage() {
  return (
    <BasicSubjectLabPage
      shellSubject="math"
      apiSubjectName="world"
      notFoundMessage="Дүниежүзі тарихы пәні табылмады"
      subjectTitle="Дүниежүзі тарихы"
      subjectChip="Тарих"
      subjectIcon={<span style={{ fontSize: "18px" }}>🌍</span>}
      tourSteps={[
        { target: '[data-tour="calculator"]', icon: "grid", title: "Тарих зертханасы", body: "Әлем тарихын интерактивті зерттеңіз." },
        { target: '[data-tour="instructions"]', icon: "help", title: "Нұсқаулық", body: "Қадам бойынша тапсырмалар." },
        { target: '[data-tour="games"]', icon: "grid", title: "Ойындар", body: "Серверден жүктелетін ойындар." },
      ]}
      formulas={FORMULAS}
      heroEmoji="🌍"
      heroTitle="Дүниежүзі тарихы зертханасы"
      heroDescription="Әлемнің маңызды оқиғалары мен өркениеттерін интерактивті түрде үйреніңіз."
      taskText="Дүниежүзі тарихындағы оқиғаларды зерттеу арқылы тақырыпты түсініңіз."
      instructionsTitle="Нұсқаулық"
      instructionsDesc="Тақырыпты қадам бойынша зерттеңіз."
      steps={[
        { title: "Ойынды таңдаңыз", body: "Төмендегі карточкалардан бірін ашыңыз." },
        { title: "Тапсырманы орындаңыз", body: "Интерактивті сұрақтарға жауап беріңіз." },
        { title: "Қорытынды жасаңыз", body: "Негізгі оқиғаларды қайталаңыз." },
      ]}
      hint="Дүниежүзі тарихы — адамзат өркениетінің даму жолын зерттейтін пән."
    />
  );
}
