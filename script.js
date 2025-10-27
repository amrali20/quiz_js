class User {
  constructor(name, id) {
    this.name = name;
    this.id = id;
    this.score = 0;
    this.currentIndex = 0;
    this.answers = new Array(10).fill("");
    this.data = [];
    this.questions = [];
    this.marked = new Array(10).fill(false);
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
    const label = isLast ? "Submit" : "Next";
    const nextLabel = answered ? "Next" : label;
    const center = hidden === "hidden" || (isLast && answered) ? "center" : "";
    const marked = this.user.marked[this.user.currentIndex];

    return `
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="bookmark ${
      marked ? "active" : ""
    }">
  <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
</svg>

      <div class="question-container container">
        <p class="question"> ${index + 1}: ${questionObj.questionText}</p>
        ${questionObj.allAnswers
          .map((ans) => `<button class="answer-btn btn">${ans}</button>`)
          .join("")}
        <div class="btn_pag ${center} ">
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
    const { currentIndex, questions, answers, marked } = this.user;
    this.quizScreen.innerHTML = this.generateQuestionHTML(
      currentIndex,
      questions[currentIndex]
    );
    const bookmarkBtn = this.quizScreen.querySelector(".bookmark");
    const answerBtns = this.quizScreen.querySelectorAll(".answer-btn");
    const backBtn = this.quizScreen.querySelector(".skip-btn");
    const confirmBtn = this.quizScreen.querySelector(".confirm-btn");
    let selected = null;

    bookmarkBtn.addEventListener("click", () => {
      bookmarkBtn.classList.toggle("active");
      marked[currentIndex] = bookmarkBtn.classList.contains("active");
      this.user.save();
    });

    answerBtns.forEach((btn) => {
      if (btn.textContent === answers[currentIndex])
        btn.classList.add("selected");

      btn.addEventListener("click", () => {
        answerBtns.forEach((b) => b.classList.remove("selected"));
        selected = btn.textContent;
        btn.classList.add("selected");
        confirmBtn.classList.remove("hidden");
        this.user.answers[currentIndex] = selected;
        this.user.save();
      });
    });

    confirmBtn.addEventListener("click", () => {
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
    const { questions } = this.user;
    this.warningScreen.style.display = "block";
    this.quizScreen.style.display = "none";

    const question = questions
      .map((el, i) => {
        let words = el.questionText.split(" ");
        let firstThree = words.slice(0, 4);
        let result = firstThree.join(" ");
        return `<button class="answer-btn summarybtn btn ${
          this.user.marked[i] ? "summarybtn_marked" : ""
        }" data-ind="${i}"> ${i + 1}: ${result}...?</button>`;
      })
      .join("");

    const markup = `
        <div class="container warning-container">
          <p class="question">Click on question button  below to return or submit.</p>
          ${question}
          <button class="submit btn">Submit</button>
        </div>`;
    this.warningScreen.innerHTML = markup;
    this.warningScreen.querySelectorAll(".summarybtn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.user.currentIndex = +btn.dataset.ind;
        this.user.save();
        this.warningScreen.style.display = "none";
        this.quizScreen.style.display = "block";
        this.renderQuestion();
      });
    });

    const yesBtn = this.warningScreen.querySelector(".submit");
    yesBtn.addEventListener("click", () => {
      this.user.currentIndex = 0;
      this.showResult();
    });
  }
}
new QuizApp();
