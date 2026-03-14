const fs = require('fs');
const file = 'src/app/dashboard/courses/[courseId]/quiz/[quizId]/page.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    `useEffect(() => { loadQuiz(); }, [quizId]);`,
    `useEffect(() => { loadQuiz(); }, [quizId]);` // Restore
);

content = content.replace(
    `    useEffect(() => { loadQuiz(); }, [quizId]);`,
    `    useEffect(() => {
        loadQuiz();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quizId]);`
);

fs.writeFileSync(file, content);
