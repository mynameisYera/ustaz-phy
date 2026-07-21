import { BasicSubjectLabPage } from "./BasicSubjectLabPage";

const FORMULAS = [
  { text: "if / else", top: "8%", left: "4%" },
  { text: "O(n log n)", top: "18%", right: "6%" },
  { text: "0 / 1", top: "42%", left: "2%" },
  { text: "HTML · CSS · JS", top: "55%", right: "3%" },
  { text: "CPU · RAM", top: "72%", left: "8%" },
  { text: "Алгоритм", top: "85%", right: "10%" },
];

export function InformaticLabPage() {
  return (
    <BasicSubjectLabPage
      shellSubject="math"
      apiSubjectName="informatic"
      notFoundMessage="Информатика пәні табылмады"
      subjectTitle="Информатика · Алгоритмдер"
      subjectChip="Информатика"
      subjectIcon={<span style={{ fontSize: "18px" }}>💻</span>}
      tourSteps={[
        { target: '[data-tour="calculator"]', icon: "grid", title: "Информатика зертханасы", body: "Алгоритмдер мен программалауды интерактивті зерттеңіз." },
        { target: '[data-tour="instructions"]', icon: "help", title: "Нұсқаулық", body: "Қадам бойынша тапсырмалар." },
        { target: '[data-tour="games"]', icon: "grid", title: "Ойындар", body: "Серверден жүктелетін ойындар." },
      ]}
      formulas={FORMULAS}
      heroEmoji="💻"
      heroTitle="Информатика зертханасы"
      heroDescription="Алгоритмдер, программалау және компьютерлік ойлауды интерактивті түрде үйреніңіз."
      instructionsTitle="Нұсқаулық"
      instructionsDesc="Тақырыпты қадам бойынша зерттеңіз."
      steps={[
        { title: "Тақырыпты таңдаңыз", body: "Төмендегі ойындардан бірін ашыңыз." },
        { title: "Тапсырманы орындаңыз", body: "Интерактивті тапсырмаларды орындаңыз." },
        { title: "Қорытынды жасаңыз", body: "Нәтижені сыныппен талқылаңыз." },
      ]}
      hint="Информатика — ақпаратты өңдеу, алгоритмдер және компьютерлік жүйелерді зерттейтін пән."
    />
  );
}
