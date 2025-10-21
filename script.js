class User {
  constructor(name, id) {
    this.name = name;
    this.id = id;
    this.score = 0;
    this.currentIndex = 0;
    this.answers = new Array(10).fill("");
    this.data = [];
    this.questions = [];
    this.submitted = false;
  }

  get storageKey() {
    return `user_${this.id}`;
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this));
  }

  static load(id) {
    const userData = localStorage.getItem(`user_${id}`);
    return userData ? Object.assign(new User(), JSON.parse(userData)) : null;
  }
}
class QuizApp {
  constructor() {
    this.quizScreen = document.querySelector(".quiz-screen");
    this.warningScreen = document.querySelector(".warning");
    this.startBtn = document.querySelector(".start-btn");
    this.user = null;

    this.startBtn.addEventListener("click", () => this.startQuiz());
  }

  async fetchQuestions() {
    try {
      const res = await fetch(
        "https://opentdb.com/api.php?amount=10&category=21&difficulty=medium&type=multiple"
      );
      const data = await res.json();
      return data.results;
    } catch (err) {
      alert("Error fetching questions: " + err);
    }
  }

  prepareQuestions() {
    this.user.questions = this.user.data.map((q) => ({
      questionText: q.question,
      allAnswers: [...q.incorrect_answers, q.correct_answer].sort(
        () => Math.random() - 0.5
      ),
    }));
  }

  generateQuestionHTML(index, questionObj, answered = false) {
    const hidden = index === 0 ? "hidden" : "";
    const isLast = index === 9;
    const label = isLast ? "Submit" : "Confirm";
    const nextLabel = answered ? "Next" : label;
    const center = hidden === "hidden" || (isLast && answered) ? "center" : "";

    return `
      <div class="question-container container">
        <p class="question">${index + 1}: ${questionObj.questionText}</p>
        ${questionObj.allAnswers
          .map((ans) => `<button class="answer-btn btn">${ans}</button>`)
          .join("")}
        <div class="btn_pag ${center}">
          <button class="skip-btn ${hidden} btn">Back</button>
          <button class="confirm-btn ${
            isLast && answered ? "hidden" : ""
          } btn">${nextLabel}</button>
        </div>
      </div>
    `;
  }

  async startQuiz() {
    const name = document.querySelector(".student-name").value.trim();
    const id = document.querySelector(".student-id").value.trim();

    if (!name || !id) return alert("Please enter name and ID");

    let existingUser = User.load(id);

    if (existingUser && existingUser.name === name) {
      this.user = existingUser;
      if (this.user.submitted) return this.showResult();
    } else {
      this.user = new User(name, id);
      this.user.data = await this.fetchQuestions();
      this.prepareQuestions();
      this.user.save();
    }

    document.querySelector(".start-screen").style.display = "none";
    this.warningScreen.style.display = "none";
    this.quizScreen.style.display = "block";

    this.renderQuestion();
  }

  renderQuestion() {
    const { currentIndex, questions, answers } = this.user;
    this.quizScreen.innerHTML = this.generateQuestionHTML(
      currentIndex,
      questions[currentIndex]
    );

    const answerBtns = this.quizScreen.querySelectorAll(".answer-btn");
    const backBtn = this.quizScreen.querySelector(".skip-btn");
    const confirmBtn = this.quizScreen.querySelector(".confirm-btn");
    let selected = null;

    answerBtns.forEach((btn) => {
      if (btn.textContent === answers[currentIndex])
        btn.classList.add("selected");
      btn.addEventListener("click", () => {
        answerBtns.forEach((b) => b.classList.remove("selected"));
        selected = btn.textContent;
        btn.classList.add("selected");
      });
    });

    confirmBtn.addEventListener("click", () => {
      if (selected) {
        this.user.answers[currentIndex] = selected;
        this.user.save();
      }

      if (currentIndex < 9) {
        this.user.currentIndex++;
        this.user.save();
        this.renderQuestion();
      } else {
        this.renderWarning();
      }
    });

    backBtn.addEventListener("click", () => {
      if (currentIndex > 0) {
        this.user.currentIndex--;
        this.user.save();
        this.renderQuestion();
      }
    });
  }

  showResult() {
    this.quizScreen.style.display = "block";
    this.warningScreen.style.display = "none";
    document.querySelector(".start-screen").style.display = "none";

    this.user.score = this.user.data.reduce(
      (acc, q, i) => acc + (q.correct_answer === this.user.answers[i] ? 1 : 0),
      0
    );
    this.user.submitted = true;
    this.user.save();

    this.quizScreen.innerHTML = `
      <div class="result">
        <h2>Quiz Finished!</h2>
        <p>Your Score: ${this.user.score} / ${this.user.data.length}</p>
        <button class="show_answers">Show Answers</button>
      </div>
    `;

    this.quizScreen
      .querySelector(".show_answers")
      .addEventListener("click", () => this.renderAnswers());
  }

  renderAnswers() {
    const { currentIndex, data, questions, answers } = this.user;

    this.quizScreen.innerHTML = this.generateQuestionHTML(
      currentIndex,
      questions[currentIndex],
      true
    );

    const answerBtns = this.quizScreen.querySelectorAll(".answer-btn");
    const backBtn = this.quizScreen.querySelector(".skip-btn");
    const nextBtn = this.quizScreen.querySelector(".confirm-btn");

    answerBtns.forEach((btn) => {
      if (btn.textContent === data[currentIndex].correct_answer) {
        btn.style.background = "green";
      } else if (answers[currentIndex] === btn.textContent) {
        btn.style.background = "red";
      }
    });
    backBtn.addEventListener("click", () => {
      if (currentIndex > 0) {
        this.user.currentIndex--;
        this.renderAnswers();
      }
    });
    if (currentIndex < 9) {
      nextBtn.addEventListener("click", () => {
        this.user.currentIndex++;
        this.renderAnswers();
      });
    }
  }
  renderWarning() {
    const { answers } = this.user;
    this.warningScreen.style.display = "block";
    this.quizScreen.style.display = "none";

    const unanswered = answers
      .map((a, i) =>
        !a
          ? `<button class="answer-btn not_answered btn" data-ind="${i}">Question ${
              i + 1
            }</button>`
          : ""
      )
      .join("");

    let markup;
    if (unanswered.includes("Question")) {
      markup = `
        <div class="container warning-container">
          <p class="question">Some questions are not answered. Click below to return or YES to submit.</p>
          ${unanswered}
          <button class="yes btn">YES</button>
        </div>
      `;
    } else {
      markup = `
        <div class="container warning-container">
          <p class="question">All questions answered. Click YES to submit or BACK to review.</p>
          <button class="yes btn">YES</button>
          <button class="cancel btn">BACK</button>
        </div>
      `;
    }
    this.warningScreen.innerHTML = markup;
    this.warningScreen.querySelectorAll(".not_answered").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.user.currentIndex = +btn.dataset.ind;
        this.user.save();
        this.warningScreen.style.display = "none";
        this.quizScreen.style.display = "block";
        this.renderQuestion();
      });
    });

    const yesBtn = this.warningScreen.querySelector(".yes");
    yesBtn.addEventListener("click", () => {
      this.user.currentIndex = 0;
      this.showResult();
    });
    const cancelBtn = this.warningScreen.querySelector(".cancel");
    if (cancelBtn)
      cancelBtn.addEventListener("click", () => {
        this.user.currentIndex = 0;
        this.user.save();
        this.warningScreen.style.display = "none";
        this.quizScreen.style.display = "block";
        this.renderQuestion();
      });
  }
}
new QuizApp();
