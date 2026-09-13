/* =========================================================
   DAILY GOALS TRACKER
   Supabase + JavaScript
========================================================= */


/* =========================================================
   1. SUPABASE CONNECTION
========================================================= */

// We will replace these two values later.

const SUPABASE_URL = "YOUR_SUPABASE_URL";

const SUPABASE_PUBLISHABLE_KEY =
  "YOUR_SUPABASE_PUBLISHABLE_KEY";


const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


/* =========================================================
   2. APP VARIABLES
========================================================= */

let currentUser = null;

let currentDate = new Date();

let currentPeriod = "daily";

let currentYear = new Date().getFullYear();

let goals = [];

let isRegisterMode = false;


/* =========================================================
   3. GET HTML ELEMENTS
========================================================= */

const authScreen = document.getElementById("authScreen");

const appScreen = document.getElementById("appScreen");

const loadingScreen = document.getElementById("loadingScreen");

const loginTab = document.getElementById("loginTab");

const registerTab = document.getElementById("registerTab");

const authButton = document.getElementById("authButton");

const emailInput = document.getElementById("email");

const passwordInput = document.getElementById("password");

const authMessage = document.getElementById("authMessage");

const userEmail = document.getElementById("userEmail");

const logoutButton = document.getElementById("logoutButton");

const goalInput = document.getElementById("goalInput");

const addGoalButton = document.getElementById("addGoalButton");

const goalsList = document.getElementById("goalsList");

const emptyState = document.getElementById("emptyState");

const goalCount = document.getElementById("goalCount");

const completedCount = document.getElementById("completedCount");

const totalCountText = document.getElementById("totalCountText");

const progressPercent = document.getElementById("progressPercent");

const progressText = document.getElementById("progressText");

const progressBar = document.getElementById("progressBar");

const streakCount = document.getElementById("streakCount");

const currentDateText = document.getElementById("currentDateText");

const currentDateSubtext = document.getElementById("currentDateSubtext");

const previousDate = document.getElementById("previousDate");

const nextDate = document.getElementById("nextDate");

const greeting = document.getElementById("greeting");

const weeklySection = document.getElementById("weeklySection");

const monthlySection = document.getElementById("monthlySection");

const yearlySection = document.getElementById("yearlySection");

const weeklyStats = document.getElementById("weeklyStats");

const monthlyStats = document.getElementById("monthlyStats");

const yearCalendar = document.getElementById("yearCalendar");

const yearText = document.getElementById("yearText");

const previousYear = document.getElementById("previousYear");

const nextYear = document.getElementById("nextYear");

const yearTotalGoals = document.getElementById("yearTotalGoals");

const yearCompletedGoals =
  document.getElementById("yearCompletedGoals");

const yearSuccessRate =
  document.getElementById("yearSuccessRate");


/* =========================================================
   4. INITIAL STARTUP
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  setGreeting();

  updateDateDisplay();

  setupEventListeners();

  showLoading(true);

  const {
    data: {
      session
    }
  } = await supabaseClient.auth.getSession();

  if (session && session.user) {

    currentUser = session.user;

    showApp();

    await loadGoals();

  } else {

    showAuth();

  }

  showLoading(false);

});


/* =========================================================
   5. AUTH STATE
========================================================= */

supabaseClient.auth.onAuthStateChange(
  async (event, session) => {

    if (session && session.user) {

      currentUser = session.user;

      showApp();

      await loadGoals();

    } else {

      currentUser = null;

      showAuth();

    }

  }
);


/* =========================================================
   6. EVENT LISTENERS
========================================================= */

function setupEventListeners() {

  loginTab.addEventListener("click", () => {

    isRegisterMode = false;

    loginTab.classList.add("active");

    registerTab.classList.remove("active");

    authButton.textContent = "Login";

    authMessage.textContent = "";

  });


  registerTab.addEventListener("click", () => {

    isRegisterMode = true;

    registerTab.classList.add("active");

    loginTab.classList.remove("active");

    authButton.textContent = "Create Account";

    authMessage.textContent = "";

  });


  authButton.addEventListener("click", handleAuthentication);


  passwordInput.addEventListener("keydown", event => {

    if (event.key === "Enter") {

      handleAuthentication();

    }

  });


  emailInput.addEventListener("keydown", event => {

    if (event.key === "Enter") {

      handleAuthentication();

    }

  });


  logoutButton.addEventListener("click", logout);


  addGoalButton.addEventListener("click", addGoal);


  goalInput.addEventListener("keydown", event => {

    if (event.key === "Enter") {

      addGoal();

    }

  });


  previousDate.addEventListener("click", () => {

    changeDate(-1);

  });


  nextDate.addEventListener("click", () => {

    changeDate(1);

  });


  previousYear.addEventListener("click", () => {

    currentYear--;

    renderYearlyCalendar();

  });


  nextYear.addEventListener("click", () => {

    currentYear++;

    renderYearlyCalendar();

  });


  document.querySelectorAll(".period-tab").forEach(button => {

    button.addEventListener("click", () => {

      document
        .querySelectorAll(".period-tab")
        .forEach(tab => tab.classList.remove("active"));

      button.classList.add("active");

      currentPeriod = button.dataset.period;

      updatePeriodView();

    });

  });

}


/* =========================================================
   7. LOGIN / REGISTER
========================================================= */

async function handleAuthentication() {

  const email = emailInput.value.trim();

  const password = passwordInput.value;


  if (!email || !password) {

    showAuthMessage(
      "Please enter your email and password."
    );

    return;

  }


  if (password.length < 6) {

    showAuthMessage(
      "Password must contain at least 6 characters."
    );

    return;

  }


  showLoading(true);

  showAuthMessage("Please wait...");


  try {

    if (isRegisterMode) {

      const {
        data,
        error
      } = await supabaseClient.auth.signUp({

        email: email,

        password: password,

        options: {

          emailRedirectTo:
            window.location.origin

        }

      });


      if (error) {

        throw error;

      }


      if (data.session) {

        showAuthMessage(
          "Account created successfully!"
        );

      } else {

        showAuthMessage(
          "Account created! Check your email to verify your account."
        );

      }

    } else {

      const {
        data,
        error
      } = await supabaseClient.auth.signInWithPassword({

        email: email,

        password: password

      });


      if (error) {

        throw error;

      }


      currentUser = data.user;

      showApp();

      await loadGoals();

    }

  } catch (error) {

    console.error(error);

    showAuthMessage(
      error.message || "Something went wrong."
    );

  }


  showLoading(false);

}


/* =========================================================
   8. LOGOUT
========================================================= */

async function logout() {

  showLoading(true);

  const {
    error
  } = await supabaseClient.auth.signOut();

  if (error) {

    console.error(error);

  }

  currentUser = null;

  goals = [];

  showAuth();

  showLoading(false);

}


/* =========================================================
   9. SHOW AUTH SCREEN
========================================================= */

function showAuth() {

  authScreen.classList.remove("hidden");

  appScreen.classList.add("hidden");

}


/* =========================================================
   10. SHOW APP
========================================================= */

function showApp() {

  authScreen.classList.add("hidden");

  appScreen.classList.remove("hidden");


  if (currentUser) {

    userEmail.textContent =
      currentUser.email || "";

  }

}


/* =========================================================
   11. LOAD GOALS
========================================================= */

async function loadGoals() {

  if (!currentUser) {

    return;

  }


  const {
    data,
    error
  } = await supabaseClient

    .from("goals")

    .select("*")

    .eq("user_id", currentUser.id)

    .order("goal_date", {
      ascending: true
    })

    .order("created_at", {
      ascending: true
    });


  if (error) {

    console.error(error);

    alert(
      "Could not load your goals. Please refresh the page."
    );

    return;

  }


  goals = data || [];


  updatePeriodView();

}


/* =========================================================
   12. ADD GOAL
========================================================= */

async function addGoal() {

  const title = goalInput.value.trim();


  if (!title) {

    alert("Please enter a goal.");

    return;

  }


  if (!currentUser) {

    alert("Please login first.");

    return;

  }


  addGoalButton.disabled = true;

  addGoalButton.textContent = "Adding...";


  const {
    data,
    error
  } = await supabaseClient

    .from("goals")

    .insert({

      user_id: currentUser.id,

      title: title,

      goal_date: formatDateForDatabase(currentDate),

      completed: false

    })

    .select()

    .single();


  if (error) {

    console.error(error);

    alert(
      "Could not add the goal. Please try again."
    );

  } else {

    goals.push(data);

    goalInput.value = "";

    updatePeriodView();

  }


  addGoalButton.disabled = false;

  addGoalButton.textContent = "+ Add Goal";

}


/* =========================================================
   13. TOGGLE GOAL
========================================================= */

async function toggleGoal(goal) {

  const newStatus = !goal.completed;


  const {
    error
  } = await supabaseClient

    .from("goals")

    .update({

      completed: newStatus

    })

    .eq("id", goal.id)

    .eq("user_id", currentUser.id);


  if (error) {

    console.error(error);

    alert(
      "Could not update the goal."
    );

    return;

  }


  goal.completed = newStatus;


  updatePeriodView();

}


/* =========================================================
   14. DELETE GOAL
========================================================= */

async function deleteGoal(goal) {

  const confirmed =
    confirm(
      `Delete "${goal.title}"?`
    );


  if (!confirmed) {

    return;

  }


  const {
    error
  } = await supabaseClient

    .from("goals")

    .delete()

    .eq("id", goal.id)

    .eq("user_id", currentUser.id);


  if (error) {

    console.error(error);

    alert(
      "Could not delete the goal."
    );

    return;

  }


  goals =
    goals.filter(
      item => item.id !== goal.id
    );


  updatePeriodView();

}


/* =========================================================
   15. UPDATE PERIOD VIEW
========================================================= */

function updatePeriodView() {

  updateDateDisplay();

  hideAllPeriodSections();


  if (currentPeriod === "daily") {

    renderDaily();

  }


  if (currentPeriod === "weekly") {

    renderWeekly();

  }


  if (currentPeriod === "monthly") {

    renderMonthly();

  }


  if (currentPeriod === "yearly") {

    renderYearly();

  }


  calculateStreak();

}


/* =========================================================
   16. HIDE PERIOD SECTIONS
========================================================= */

function hideAllPeriodSections() {

  weeklySection.classList.add("hidden");

  monthlySection.classList.add("hidden");

  yearlySection.classList.add("hidden");

}


/* =========================================================
   17. DAILY VIEW
========================================================= */

function renderDaily() {

  const dateString =
    formatDateForDatabase(currentDate);


  const dailyGoals =
    goals.filter(
      goal => goal.goal_date === dateString
    );


  renderGoalsList(dailyGoals);


  updateStats(dailyGoals);

}


/* =========================================================
   18. WEEKLY VIEW
========================================================= */

function renderWeekly() {

  weeklySection.classList.remove("hidden");

  const start =
    getStartOfWeek(currentDate);


  let html = "";


  for (let i = 0; i < 7; i++) {

    const date =
      new Date(start);

    date.setDate(
      start.getDate() + i
    );


    const dateString =
      formatDateForDatabase(date);


    const dayGoals =
      goals.filter(
        goal => goal.goal_date === dateString
      );


    const total =
      dayGoals.length;


    const completed =
      dayGoals.filter(
        goal => goal.completed
      ).length;


    const percent =
      total === 0
        ? 0
        : Math.round(
            (completed / total) * 100
          );


    html += `

      <div class="period-day">

        <div class="period-day-header">

          <span>
            ${formatShortDate(date)}
          </span>

          <strong>
            ${completed}/${total} (${percent}%)
          </strong>

        </div>

        <div class="period-progress">

          <div
            class="period-progress-fill"
            style="width:${percent}%">
          </div>

        </div>

      </div>

    `;

  }


  weeklyStats.innerHTML = html;

}


/* =========================================================
   19. MONTHLY VIEW
========================================================= */

function renderMonthly() {

  monthlySection.classList.remove("hidden");


  const year =
    currentDate.getFullYear();

  const month =
    currentDate.getMonth();


  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();


  let html = "";


  for (let day = 1; day <= daysInMonth; day++) {

    const date =
      new Date(
        year,
        month,
        day
      );


    const dateString =
      formatDateForDatabase(date);


    const dayGoals =
      goals.filter(
        goal => goal.goal_date === dateString
      );


    const total =
      dayGoals.length;


    const completed =
      dayGoals.filter(
        goal => goal.completed
      ).length;


    const percent =
      total === 0
        ? 0
        : Math.round(
            (completed / total) * 100
          );


    html += `

      <div class="period-day">

        <div class="period-day-header">

          <span>
            ${formatShortDate(date)}
          </span>

          <strong>
            ${completed}/${total} (${percent}%)
          </strong>

        </div>

        <div class="period-progress">

          <div
            class="period-progress-fill"
            style="width:${percent}%">
          </div>

        </div>

      </div>

    `;

  }


  monthlyStats.innerHTML = html;

}


/* =========================================================
   20. YEARLY VIEW
========================================================= */

function renderYearly() {

  yearlySection.classList.remove("hidden");

  renderYearlyCalendar();

}


/* =========================================================
   21. YEAR CALENDAR
========================================================= */

function renderYearlyCalendar() {

  yearText.textContent =
    currentYear;


  yearCalendar.innerHTML = "";


  const firstDay =
    new Date(
      currentYear,
      0,
      1
    ).getDay();


  const daysInYear =
    isLeapYear(currentYear)
      ? 366
      : 365;


  for (let i = 0; i < firstDay; i++) {

    const blank =
      document.createElement("div");

    blank.className =
      "calendar-day";

    blank.style.visibility =
      "hidden";

    yearCalendar.appendChild(blank);

  }


  let totalGoals = 0;

  let totalCompleted = 0;


  for (
    let day = 1;
    day <= daysInYear;
    day++
  ) {

    const date =
      new Date(
        currentYear,
        0,
        day
      );


    const dateString =
      formatDateForDatabase(date);


    const dayGoals =
      goals.filter(
        goal =>
          goal.goal_date === dateString
      );


    const total =
      dayGoals.length;


    const completed =
      dayGoals.filter(
        goal => goal.completed
      ).length;


    totalGoals += total;

    totalCompleted += completed;


    const dayElement =
      document.createElement("div");


    dayElement.className =
      "calendar-day";


    if (
      total > 0 &&
      completed === total
    ) {

      dayElement.classList.add(
        "complete"
      );

    } else if (completed > 0) {

      dayElement.classList.add(
        "partial"
      );

    }


    const today =
      new Date();


    if (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    ) {

      dayElement.classList.add(
        "today"
      );

    }


    dayElement.title =
      `${formatShortDate(date)} — ${completed}/${total} completed`;


    yearCalendar.appendChild(
      dayElement
    );

  }


  const rate =
    totalGoals === 0
      ? 0
      : Math.round(
          (totalCompleted / totalGoals) * 100
        );


  yearTotalGoals.textContent =
    totalGoals;


  yearCompletedGoals.textContent =
    totalCompleted;


  yearSuccessRate.textContent =
    `${rate}%`;

}


/* =========================================================
   22. RENDER GOALS LIST
========================================================= */

function renderGoalsList(goalArray) {

  goalsList.innerHTML = "";


  if (goalArray.length === 0) {

    goalsList.appendChild(
      emptyState
    );

    emptyState.classList.remove(
      "hidden"
    );

    goalCount.textContent =
      "0 goals";

    return;

  }


  emptyState.classList.add(
    "hidden"
  );


  goalCount.textContent =
    `${goalArray.length} ${
      goalArray.length === 1
        ? "goal"
        : "goals"
    }`;


  goalArray.forEach(goal => {

    const item =
      document.createElement("div");


    item.className =
      "goal-item";


    if (goal.completed) {

      item.classList.add(
        "completed"
      );

    }


    const checkbox =
      document.createElement("button");


    checkbox.className =
      "goal-checkbox";


    if (goal.completed) {

      checkbox.classList.add(
        "completed"
      );

      checkbox.textContent =
        "✓";

    }


    checkbox.addEventListener(
      "click",
      () => toggleGoal(goal)
    );


    const title =
      document.createElement("div");


    title.className =
      "goal-title";


    title.textContent =
      goal.title;


    const deleteButton =
      document.createElement("button");


    deleteButton.className =
      "delete-goal";


    deleteButton.textContent =
      "🗑";


    deleteButton.setAttribute(
      "aria-label",
      "Delete goal"
    );


    deleteButton.addEventListener(
      "click",
      () => deleteGoal(goal)
    );


    item.appendChild(
      checkbox
    );


    item.appendChild(
      title
    );


    item.appendChild(
      deleteButton
    );


    goalsList.appendChild(
      item
    );

  });

}


/* =========================================================
   23. UPDATE STATS
========================================================= */

function updateStats(goalArray) {

  const total =
    goalArray.length;


  const completed =
    goalArray.filter(
      goal => goal.completed
    ).length;


  const percent =
    total === 0
      ? 0
      : Math.round(
          (completed / total) * 100
        );


  completedCount.textContent =
    completed;


  totalCountText.textContent =
    `/ ${total}`;


  progressPercent.textContent =
    `${percent}%`;


  progressText.textContent =
    `${percent}%`;


  progressBar.style.width =
    `${percent}%`;

}


/* =========================================================
   24. DATE CHANGE
========================================================= */

function changeDate(amount) {

  currentDate.setDate(
    currentDate.getDate() + amount
  );


  currentYear =
    currentDate.getFullYear();


  updatePeriodView();

}


/* =========================================================
   25. DATE DISPLAY
========================================================= */

function updateDateDisplay() {

  const today =
    new Date();


  const selected =
    formatDateForDatabase(
      currentDate
    );


  const todayString =
    formatDateForDatabase(
      today
    );


  if (selected === todayString) {

    currentDateText.textContent =
      "Today";

  } else {

    currentDateText.textContent =
      currentDate.toLocaleDateString(
        undefined,
        {
          weekday: "long"
        }
      );

  }


  currentDateSubtext.textContent =
    currentDate.toLocaleDateString(
      undefined,
      {
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    );

}


/* =========================================================
   26. GREETING
========================================================= */

function setGreeting() {

  const hour =
    new Date().getHours();


  if (hour < 12) {

    greeting.textContent =
      "Good morning 👋";

  } else if (hour < 18) {

    greeting.textContent =
      "Good afternoon 👋";

  } else {

    greeting.textContent =
      "Good evening 👋";

  }

}


/* =========================================================
   27. STREAK
========================================================= */

async function calculateStreak() {

  if (!currentUser) {

    streakCount.textContent =
      "0";

    return;

  }


  let streak = 0;

  const date =
    new Date();


  for (let i = 0; i < 365; i++) {

    const dateString =
      formatDateForDatabase(date);


    const dayGoals =
      goals.filter(
        goal => goal.goal_date === dateString
      );


    if (dayGoals.length === 0) {

      break;

    }


    const allCompleted =
      dayGoals.every(
        goal => goal.completed
      );


    if (!allCompleted) {

      break;

    }


    streak++;


    date.setDate(
      date.getDate() - 1
    );

  }


  streakCount.textContent =
    streak;

}


/* =========================================================
   28. HELPER FUNCTIONS
========================================================= */

function formatDateForDatabase(date) {

  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");


  const day =
    String(
      date.getDate()
    ).padStart(2, "0");


  return `${year}-${month}-${day}`;

}


function formatShortDate(date) {

  return date.toLocaleDateString(
    undefined,
    {
      weekday: "short",
      day: "numeric",
      month: "short"
    }
  );

}


function getStartOfWeek(date) {

  const result =
    new Date(date);


  const day =
    result.getDay();


  result.setDate(
    result.getDate() - day
  );


  result.setHours(
    0,
    0,
    0,
    0
  );


  return result;

}


function isLeapYear(year) {

  return (
    year % 4 === 0 &&
    (
      year % 100 !== 0 ||
      year % 400 === 0
    )
  );

}


function showAuthMessage(message) {

  authMessage.textContent =
    message;

}


function showLoading(show) {

  if (show) {

    loadingScreen.classList.remove(
      "hidden"
    );

  } else {

    loadingScreen.classList.add(
      "hidden"
    );

  }

          }
