const fs = require('fs');
const file = 'src/app/dashboard/courses/[courseId]/quiz/[quizId]/page.js';
let content = fs.readFileSync(file, 'utf8');

// The sed command left `setQuestions(questionsData || []);` right after `setQuestions(selectedQuestions || []);`
content = content.replace(
`        setQuestions(selectedQuestions || []);
        setQuestions(questionsData || []);`,
`        setQuestions(selectedQuestions || []);`
);

fs.writeFileSync(file, content);
