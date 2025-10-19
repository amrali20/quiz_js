const startBtn = document.querySelector(".start-btn");

startBtn.addEventListener("click", async function () {
  let score = 0;
  let currentIndex = 0;
  let questions = [];

  const name = document.querySelector(".student-name").value.trim();
  const id = document.querySelector(".student-id").value.trim();
  if (!name || !id) return;

  localStorage.setItem("studentName", name);
  localStorage.setItem("studentId", id);

  const GET_JSON = async function () {
    try {
      const res = await fetch(
        "https://opentdb.com/api.php?amount=10&category=21&difficulty=medium&type=multiple"
      );
      const data = await res.json();
      return data.results;
    } catch (err) {
      alert("Error fetching questions: " + err);
    }
  };

  questions = await GET_JSON();

  document.querySelector(".start-screen").style.display = "none";
  const quiz_screen = document.querySelector(".quiz-screen");
  quiz_screen.style.display = "block";

  function generateQuestionHTML(index, questionObj) {
    const questionText = questionObj.question;
    const answers = [
      ...questionObj.incorrect_answers,
      questionObj.correct_answer,
    ];
    answers.sort(() => Math.random() - 0.5);

    return `
      <div class="question-container">
        <p class="question">${index + 1}: ${questionText}</p>
        ${answers
          .map((answer) => `<button class="answer-btn">${answer}</button>`)
          .join("")}
        <button class="skip-btn">Skip</button>
      </div>
    `;
  }

  function renderQuestion() {
    quiz_screen.innerHTML = generateQuestionHTML(
      currentIndex,
      questions[currentIndex]
    );

    const answerBtns = quiz_screen.querySelectorAll(".answer-btn");
    const skipBtn = quiz_screen.querySelector(".skip-btn");

    answerBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        const selected = btn.textContent;
        const correct = questions[currentIndex].correct_answer;
        answerBtns.forEach((b) => (b.disabled = true));

        if (selected === correct) {
          btn.style.background = "green";
          score++;
        } else {
          btn.style.background = "red";
          answerBtns.forEach((b) => {
            if (b.textContent === correct) {
              b.style.background = "green";
            }
          });
        }
        setTimeout(() => {
          currentIndex++;
          if (currentIndex < questions.length) renderQuestion();
          else showResult();
        }, 1000);
      });
    });

    skipBtn.addEventListener("click", function () {
      currentIndex++;
      if (currentIndex < questions.length) renderQuestion();
      else showResult();
    });
  }

  function showResult() {
    quiz_screen.innerHTML = `
      <div class="result">
        <h2>Quiz Finished!</h2>
        <p>Your Score: ${score} / ${questions.length}</p>
      </div>
    `;
  }

  renderQuestion();
});
