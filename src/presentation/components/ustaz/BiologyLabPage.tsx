import { BasicSubjectLabPage } from "./BasicSubjectLabPage";

const FORMULAS = [
  { text: "DNA → RNA → Protein", top: "8%", left: "4%" },
  { text: "C₆H₁₂O₆ + O₂", top: "18%", right: "6%" },
  { text: "2n = 46", top: "42%", left: "2%" },
  { text: "ATP ⇌ ADP", top: "55%", right: "3%" },
  { text: "Photosynthesis", top: "72%", left: "8%" },
  { text: "Mitosis", top: "85%", right: "10%" },
];

export function BiologyLabPage() {
  return (
    <BasicSubjectLabPage
      shellSubject="chemistry"
      apiSubjectName="biology"
      notFoundMessage="Биология пәні табылмады"
      subjectTitle="Биология · Тірі ағзалар"
      subjectChip="Биология"
      subjectIcon={<span style={{ fontSize: "18px" }}>🧬</span>}
      tourSteps={[
        { target: '[data-tour="calculator"]', icon: "grid", title: "Биология зертханасы", body: "Тақырыпты интерактивті түрде зерттеңіз." },
        { target: '[data-tour="instructions"]', icon: "help", title: "Нұсқаулық", body: "Қадам бойынша тапсырмалар." },
        { target: '[data-tour="games"]', icon: "grid", title: "Ойындар", body: "Серверден жүктелетін ойындар." },
      ]}
      formulas={FORMULAS}
      heroEmoji="🧬"
      heroTitle="Биология зертханасы"
      heroDescription="Тірі ағзалар, жасуша құрылымы және биологиялық процестерді интерактивті зерттеңіз."
      taskText="Биологиялық құбылыстарды зерттеу арқылы тақырыпты түсініңіз."
      instructionsTitle="Нұсқаулық"
      instructionsDesc="Тақырыпты қадам бойынша зерттеңіз."
      steps={[
        { title: "Тақырыпты таңдаңыз", body: "Төмендегі ойындардан бірін ашыңыз." },
        { title: "Зерттеуді бастаңыз", body: "Интерактивті тапсырмаларды орындаңыз." },
        { title: "Қорытынды жасаңыз", body: "Нәтижені сыныппен талқылаңыз." },
      ]}
      hint="Биология — тірі ағзалардың құрылымы мен өмір сүру заңдылықтарын зерттейтін ғылым."
    />
  );
}
