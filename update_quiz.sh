sed -i -e '/setQuiz(quizData);/a\
        // Randomize questions and select up to 10\
        const shuffledQuestions = questionsData?.sort(() => 0.5 - Math.random());\
        const selectedQuestions = shuffledQuestions?.slice(0, 10);\
        setQuestions(selectedQuestions || []);' src/app/dashboard/courses/\[courseId\]/quiz/\[quizId\]/page.js
  
