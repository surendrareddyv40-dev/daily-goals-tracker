/* =========================================================
   DAILY GOALS TRACKER
   SUPABASE + JAVASCRIPT
   VERSION: FINAL
========================================================= */


/* =========================================================
   1. SUPABASE CONNECTION
========================================================= */

const SUPABASE_URL =
  "https://bvzvrxftmeldsxzpvibq.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_URrHQtxJb_kGfyInNLyvbQ_EImnzyBE";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


/* =========================================================
   2. APP STATE
========================================================= */

let currentUser = null;
let currentDate = new Date();
let currentPeriod = "daily";
let currentYear = new Date().getFullYear();
let goals = [];
let isRegisterMode = false;


/* =========================================================
   3. HTML ELEMENTS
========================================================= */

const authScreen =
  document.getElementById("authScreen");

const appScreen =
  document.getElementById("appScreen");

const loadingScreen =
  document.getElementById("loadingScreen");

const loginTab =
  document.getElementById("loginTab");

const registerTab =
  document.getElementById("registerTab");

const authButton =
  document.getElementById("authButton");

const emailInput =
  document.getElementById("email");

const passwordInput =
  document.getElementById("password");

const authMessage =
  document.getElementById("authMessage");

const userEmail =
  document.getElementById("userEmail");

const logoutButton =
  document.getElementById("logoutButton");

const goalInput =
  document.getElementById("goalInput");

const addGoalButton =
  document.getElementById("addGoalButton");

const goalsList =
  document.getElementById("goalsList");

const emptyState =
  document.getElementById("emptyState");

const goalCount =
  document.getElementById("goalCount");

const completedCount =
  document.getElementById("completedCount");

const totalCountText =
  document.getElementById("totalCountText");

const progressPercent =
  document.getElementById("progressPercent");

const progressText =
  document.getElementById("progressText");

const progressBar =
  document.getElementById("progressBar");

const streakCount =
  document.getElementById("streakCount");

const currentDateText =
  document.getElementById("currentDateText");

const currentDateSubtext =
  document.getElementById("currentDateSubtext");

const previousDate =
  document.getElementById("previousDate");

const nextDate =
  document.getElementById("nextDate");

const greeting =
  document.getElementById("greeting");

const weeklySection =
  document.getElementById("weeklySection");

const monthlySection =
  document.getElementById("monthlySection");

const yearlySection =
  document.getElementById("yearlySection");

const weeklyStats =
  document.getElementById("weeklyStats");

const monthlyStats =
  document.getElementById("monthlyStats");

const yearCalendar =
  document.getElementById("yearCalendar");

const yearText =
  document.getElementById("yearText");

const previousYear =
  document.getElementById("previousYear");

const nextYear =
  document.getElementById("nextYear");

const yearTotalGoals =
  document.getElementById("yearTotalGoals");

const yearCompletedGoals =
  document.getElementById("yearCompletedGoals");

const yearSuccessRate =
  document.getElementById("yearSuccessRate");


/* =========================================================
   4. START APPLICATION
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async function () {

    setupEventListeners();

    setGreeting();

    updateDateDisplay();

    showLoading(true);

    try {

      const {
        data,
        error
      } =
        await supabaseClient.auth.getSession();

      if (error) {
        throw error;
      }

      if (
        data &&
        data.session &&
        data.session.user
      ) {

        currentUser =
          data.session.user;

        showApp();

        await loadGoals();

      } else {

        showAuth();

      }

    } catch (error) {

      console.error(
        "Startup error:",
        error
      );

      showAuth();

    }

    showLoading(false);

  }
);


/* =========================================================
   5. AUTH STATE LISTENER
========================================================= */

supabaseClient.auth.onAuthStateChange(
  function (event, session) {

    if (
      session &&
      session.user
    ) {

      currentUser =
        session.user;

      showApp();

      setTimeout(
        function () {
          loadGoals();
        },
        0
      );

    } else {

      currentUser = null;

      goals = [];

      showAuth();

    }

  }
);


/* =========================================================
   6. EVENT LISTENERS
========================================================= */

function setupEventListeners() {

  if (loginTab) {

    loginTab.addEventListener(
      "click",
      function () {

        isRegisterMode = false;

        loginTab.classList.add(
          "active"
        );

        if (registerTab) {
          registerTab.classList.remove(
            "active"
          );
        }

        if (authButton) {
          authButton.textContent =
            "Login";
        }

        showAuthMessage("");

      }
    );

  }


  if (registerTab) {

    registerTab.addEventListener(
      "click",
      function () {

        isRegisterMode = true;

        registerTab.classList.add(
          "active"
        );

        if (loginTab) {
          loginTab.classList.remove(
            "active"
          );
        }

        if (authButton) {
          authButton.textContent =
            "Create Account";
        }

        showAuthMessage("");

      }
    );

  }


  if (authButton) {

    authButton.addEventListener(
      "click",
      handleAuthentication
    );

  }


  if (emailInput) {

    emailInput.addEventListener(
      "keydown",
      function (event) {

        if (event.key === "Enter") {
          handleAuthentication();
        }

      }
    );

  }


  if (passwordInput) {

    passwordInput.addEventListener(
      "keydown",
      function (event) {

        if (event.key === "Enter") {
          handleAuthentication();
        }

      }
    );

  }


  if (logoutButton) {

    logoutButton.addEventListener(
      "click",
      logout
    );

  }


  if (addGoalButton) {

    addGoalButton.addEventListener(
      "click",
      addGoal
    );

  }


  if (goalInput) {

    goalInput.addEventListener(
      "keydown",
      function (event) {

        if (event.key === "Enter") {
          addGoal();
        }

      }
    );

  }


  if (previousDate) {

    previousDate.addEventListener(
      "click",
      function () {
        changeDate(-1);
      }
    );

  }


  if (nextDate) {

    nextDate.addEventListener(
      "click",
      function () {
        changeDate(1);
      }
    );

  }


  if (previousYear) {

    previousYear.addEventListener(
      "click",
      function () {

        currentYear--;

        renderYearlyCalendar();

      }
    );

  }


  if (nextYear) {

    nextYear.addEventListener(
      "click",
      function () {

        currentYear++;

        renderYearlyCalendar();

      }
    );

  }


  document
    .querySelectorAll(".period-tab")
    .forEach(
      function (button) {

        button.addEventListener(
          "click",
          function () {

            document
              .querySelectorAll(
                ".period-tab"
              )
              .forEach(
                function (tab) {
                  tab.classList.remove(
                    "active"
                  );
                }
              );

            button.classList.add(
              "active"
            );

            currentPeriod =
              button.dataset.period;

            updatePeriodView();

          }
        );

      }
    );

}


/* =========================================================
   7. LOGIN / REGISTER
========================================================= */

async function handleAuthentication() {

  if (!emailInput || !passwordInput) {
    return;
  }

  const email =
    emailInput.value.trim();

  const password =
    passwordInput.value;


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

  showAuthMessage(
    "Please wait..."
  );


  try {

    if (isRegisterMode) {

      const {
        data,
        error
      } =
        await supabaseClient.auth.signUp({

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


      if (
        data &&
        data.session
      ) {

        currentUser =
          data.user;

        showApp();

        await loadGoals();

        showAuthMessage(
          "Account created successfully!"
        );

      } else {

        showAuthMessage(
          "Account created! Please check your email and verify your account."
        );

      }

    } else {

      const {
        data,
        error
      } =
        await supabaseClient.auth
          .signInWithPassword({

            email: email,

            password: password

          });


      if (error) {
        throw error;
      }


      currentUser =
        data.user;

      showApp();

      await loadGoals();

    }

  } catch (error) {

    console.error(
      "Authentication error:",
      error
    );

    showAuthMessage(
      error.message ||
      "Login failed. Please try again."
    );

  }

  showLoading(false);

}


/* =========================================================
   8. LOGOUT
========================================================= */

async function logout() {

  showLoading(true);

  try {

    const {
      error
    } =
      await supabaseClient.auth.signOut();

    if (error) {
      throw error;
    }

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

  }

  currentUser = null;

  goals = [];

  showAuth();

  showLoading(false);

}


/* =========================================================
   9. SHOW AUTH
========================================================= */

function showAuth() {

  if (!authScreen || !appScreen) {
    return;
  }

  authScreen.classList.remove(
    "hidden"
  );

  appScreen.classList.add(
    "hidden"
  );

  /*
    IMPORTANT:
    Any graph/statistics inside appScreen
    automatically disappear when logged out.
  */

}


/* =========================================================
   10. SHOW APP
========================================================= */

function showApp() {

  if (!authScreen || !appScreen) {
    return;
  }

  authScreen.classList.add(
    "hidden"
  );

  appScreen.classList.remove(
    "hidden"
  );


  if (
    currentUser &&
    userEmail
  ) {

    userEmail.textContent =
      currentUser.email || "";

  }

}


/* =========================================================
   11. LOAD USER GOALS
========================================================= */

async function loadGoals() {

  if (!currentUser) {
    return;
  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("goals")
        .select("*")
        .eq(
          "user_id",
          currentUser.id
        )
        .order(
          "goal_date",
          {
            ascending: true
          }
        )
        .order(
          "created_at",
          {
            ascending: true
          }
        );


    if (error) {
      throw error;
    }


    goals =
      data || [];

    updatePeriodView();

  } catch (error) {

    console.error(
      "Load goals error:",
      error
    );

    alert(
      "Could not load your goals."
    );

  }

}


/* =========================================================
   12. ADD GOAL
========================================================= */

async function addGoal() {

  if (!goalInput) {
    return;
  }


  const title =
    goalInput.value.trim();


  if (!title) {

    alert(
      "Please enter a goal."
    );

    return;

  }


  if (!currentUser) {

    alert(
      "Please login first."
    );

    return;

  }


  addGoalButton.disabled =
    true;

  addGoalButton.textContent =
    "Adding...";


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("goals")
        .insert({

          user_id:
            currentUser.id,

          title:
            title,

          goal_date:
            formatDateForDatabase(
              currentDate
            ),

          completed:
            false

        })
        .select()
        .single();


    if (error) {
      throw error;
    }


    goals.push(data);

    goalInput.value = "";

    updatePeriodView();

  } catch (error) {

    console.error(
      "Add goal error:",
      error
    );

    alert(
      error.message ||
      "Could not add the goal."
    );

  }


  addGoalButton.disabled =
    false;

  addGoalButton.textContent =
    "+ Add Goal";

}


/* =========================================================
   13. TOGGLE GOAL
========================================================= */

async function toggleGoal(goal) {

  if (!currentUser) {
    return;
  }


  const newStatus =
    !goal.completed;


  try {

    const {
      error
    } =
      await supabaseClient
        .from("goals")
        .update({

          completed:
            newStatus

        })
        .eq(
          "id",
          goal.id
        )
        .eq(
          "user_id",
          currentUser.id
        );


    if (error) {
      throw error;
    }


    goal.completed =
      newStatus;

    updatePeriodView();

  } catch (error) {

    console.error(
      "Toggle goal error:",
      error
    );

    alert(
      "Could not update the goal."
    );

  }

}


/* =========================================================
   14. DELETE GOAL
========================================================= */

async function deleteGoal(goal) {

  if (!currentUser) {
    return;
  }


  const confirmed =
    window.confirm(
      `Delete "${goal.title}"?`
    );


  if (!confirmed) {
    return;
  }


  try {

    const {
      error
    } =
      await supabaseClient
        .from("goals")
        .delete()
        .eq(
          "id",
          goal.id
        )
        .eq(
          "user_id",
          currentUser.id
        );


    if (error) {
      throw error;
    }


    goals =
      goals.filter(
        function (item) {
          return item.id !== goal.id;
        }
      );

    updatePeriodView();

  } catch (error) {

    console.error(
      "Delete goal error:",
      error
    );

    alert(
      "Could not delete the goal."
    );

  }

}


/* =========================================================
   15. UPDATE PERIOD
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

  /*
    REAL GRAPH
    Only render when app is visible.
  */

  if (
    appScreen &&
    !appScreen.classList.contains("hidden")
  ) {

    renderProgressGraph();

  }

}


/* =========================================================
   16. HIDE PERIOD SECTIONS
========================================================= */

function hideAllPeriodSections() {

  if (weeklySection) {
    weeklySection.classList.add("hidden");
  }

  if (monthlySection) {
    monthlySection.classList.add("hidden");
  }

  if (yearlySection) {
    yearlySection.classList.add("hidden");
  }

}


/* =========================================================
   17. DAILY
========================================================= */

function renderDaily() {

  const dateString =
    formatDateForDatabase(
      currentDate
    );


  const dailyGoals =
    goals.filter(
      function (goal) {

        return (
          goal.goal_date ===
          dateString
        );

      }
    );


  renderGoalsList(
    dailyGoals
  );

  updateStats(
    dailyGoals
  );

}


/* =========================================================
   18. WEEKLY
========================================================= */

function renderWeekly() {

  if (weeklySection) {
    weeklySection.classList.remove(
      "hidden"
    );
  }


  const start =
    getStartOfWeek(
      currentDate
    );


  let html = "";


  for (
    let i = 0;
    i < 7;
    i++
  ) {

    const date =
      new Date(start);

    date.setDate(
      start.getDate() + i
    );


    const dateString =
      formatDateForDatabase(
        date
      );


    const dayGoals =
      goals.filter(
        function (goal) {

          return (
            goal.goal_date ===
            dateString
          );

        }
      );


    const total =
      dayGoals.length;


    const completed =
      dayGoals.filter(
        function (goal) {
          return goal.completed;
        }
      ).length;


    const percent =
      total === 0
        ? 0
        : Math.round(
            (
              completed /
              total
            ) * 100
          );


    html += `

      <div class="period-day">

        <div class="period-day-header">

          <span>
            ${formatShortDate(date)}
          </span>

          <strong>
            ${completed}/${total}
            (${percent}%)
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


  if (weeklyStats) {
    weeklyStats.innerHTML =
      html;
  }

}


/* =========================================================
   19. MONTHLY
========================================================= */

function renderMonthly() {

  if (monthlySection) {
    monthlySection.classList.remove(
      "hidden"
    );
  }


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


  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {

    const date =
      new Date(
        year,
        month,
        day
      );


    const dateString =
      formatDateForDatabase(
        date
      );


    const dayGoals =
      goals.filter(
        function (goal) {

          return (
            goal.goal_date ===
            dateString
          );

        }
      );


    const total =
      dayGoals.length;


    const completed =
      dayGoals.filter(
        function (goal) {
          return goal.completed;
        }
      ).length;


    const percent =
      total === 0
        ? 0
        : Math.round(
            (
              completed /
              total
            ) * 100
          );


    html += `

      <div class="period-day">

        <div class="period-day-header">

          <span>
            ${formatShortDate(date)}
          </span>

          <strong>
            ${completed}/${total}
            (${percent}%)
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


  if (monthlyStats) {
    monthlyStats.innerHTML =
      html;
  }

}


/* =========================================================
   20. YEARLY
========================================================= */

function renderYearly() {

  if (yearlySection) {
    yearlySection.classList.remove(
      "hidden"
    );
  }


  renderYearlyCalendar();

}


/* =========================================================
   21. YEAR CALENDAR
========================================================= */

function renderYearlyCalendar() {

  if (!yearCalendar) {
    return;
  }


  if (yearText) {
    yearText.textContent =
      currentYear;
  }


  yearCalendar.innerHTML =
    "";


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


  for (
    let i = 0;
    i < firstDay;
    i++
  ) {

    const blank =
      document.createElement(
        "div"
      );

    blank.className =
      "calendar-day";

    blank.style.visibility =
      "hidden";

    yearCalendar.appendChild(
      blank
    );

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
      formatDateForDatabase(
        date
      );


    const dayGoals =
      goals.filter(
        function (goal) {

          return (
            goal.goal_date ===
            dateString
          );

        }
      );


    const total =
      dayGoals.length;


    const completed =
      dayGoals.filter(
        function (goal) {
          return goal.completed;
        }
      ).length;


    totalGoals += total;

    totalCompleted += completed;


    const dayElement =
      document.createElement(
        "div"
      );


    dayElement.className =
      "calendar-day";


    if (
      total > 0 &&
      completed === total
    ) {

      dayElement.classList.add(
        "complete"
      );

    } else if (
      completed > 0
    ) {

      dayElement.classList.add(
        "partial"
      );

    }


    const today =
      new Date();


    if (
      date.getFullYear() ===
        today.getFullYear() &&
      date.getMonth() ===
        today.getMonth() &&
      date.getDate() ===
        today.getDate()
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
          (
            totalCompleted /
            totalGoals
          ) * 100
        );


  if (yearTotalGoals) {
    yearTotalGoals.textContent =
      totalGoals;
  }


  if (yearCompletedGoals) {
    yearCompletedGoals.textContent =
      totalCompleted;
  }


  if (yearSuccessRate) {
    yearSuccessRate.textContent =
      `${rate}%`;
  }

}


/* =========================================================
   22. GOALS LIST
========================================================= */

function renderGoalsList(
  goalArray
) {

  if (!goalsList) {
    return;
  }


  goalsList.innerHTML =
    "";


  if (
    goalArray.length === 0
  ) {

    if (emptyState) {

      emptyState.classList.remove(
        "hidden"
      );

      goalsList.appendChild(
        emptyState
      );

    }


    if (goalCount) {
      goalCount.textContent =
        "0 goals";
    }

    return;

  }


  if (emptyState) {
    emptyState.classList.add(
      "hidden"
    );
  }


  if (goalCount) {

    goalCount.textContent =
      `${goalArray.length} ${
        goalArray.length === 1
          ? "goal"
          : "goals"
      }`;

  }


  goalArray.forEach(
    function (goal) {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "goal-item";


      if (goal.completed) {
        item.classList.add(
          "completed"
        );
      }


      const checkbox =
        document.createElement(
          "button"
        );


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
        function () {
          toggleGoal(goal);
        }
      );


      const title =
        document.createElement(
          "div"
        );


      title.className =
        "goal-title";

      title.textContent =
        goal.title;


      const deleteButton =
        document.createElement(
          "button"
        );


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
        function () {
          deleteGoal(goal);
        }
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

    }
  );

}


/* =========================================================
   23. STATISTICS
========================================================= */

function updateStats(
  goalArray
) {

  const total =
    goalArray.length;


  const completed =
    goalArray.filter(
      function (goal) {
        return goal.completed;
      }
    ).length;


  const percent =
    total === 0
      ? 0
      : Math.round(
          (
            completed /
            total
          ) * 100
        );


  if (completedCount) {
    completedCount.textContent =
      completed;
  }


  if (totalCountText) {
    totalCountText.textContent =
      `/ ${total}`;
  }


  if (progressPercent) {
    progressPercent.textContent =
      `${percent}%`;
  }


  if (progressText) {
    progressText.textContent =
      `${percent}%`;
  }


  if (progressBar) {
    progressBar.style.width =
      `${percent}%`;
  }

}


/* =========================================================
   24. REAL PROGRESS GRAPH
========================================================= */

function renderProgressGraph() {

  /*
    IMPORTANT:
    Graph is rendered ONLY inside appScreen.
    It will NEVER be shown on login page.
  */

  if (
    !appScreen ||
    appScreen.classList.contains("hidden")
  ) {
    return;
  }


  let graphContainer =
    document.getElementById(
      "progressGraph"
    );


  /*
    If HTML does not already have
    #progressGraph, create it.
  */

  if (!graphContainer) {

    graphContainer =
      document.createElement(
        "div"
      );

    graphContainer.id =
      "progressGraph";

    graphContainer.className =
      "progress-graph-card";


    const title =
      document.createElement(
        "h2"
      );

    title.textContent =
      "📈 Progress Graph";


    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.id =
      "goalProgressCanvas";


    canvas.style.width =
      "100%";

    canvas.style.height =
      "260px";

    canvas.style.display =
      "block";


    graphContainer.appendChild(
      title
    );

    graphContainer.appendChild(
      canvas
    );


    /*
      Put graph INSIDE appScreen.
      Therefore it cannot appear on login screen.
    */

    appScreen.appendChild(
      graphContainer
    );

  }


  const canvas =
    document.getElementById(
      "goalProgressCanvas"
    );


  if (!canvas) {
    return;
  }


  drawProgressChart(
    canvas
  );

}


/* =========================================================
   25. DRAW GRAPH
========================================================= */

function drawProgressChart(
  canvas
) {

  const ctx =
    canvas.getContext("2d");


  if (!ctx) {
    return;
  }


  const width =
    canvas.clientWidth || 600;

  const height =
    260;


  const deviceRatio =
    window.devicePixelRatio || 1;


  canvas.width =
    width * deviceRatio;

  canvas.height =
    height * deviceRatio;


  ctx.setTransform(
    deviceRatio,
    0,
    0,
    deviceRatio,
    0,
    0
  );


  ctx.clearRect(
    0,
    0,
    width,
    height
  );


  /*
    Use last 7 days for daily graph.
  */

  const points = [];


  const today =
    new Date();


  for (
    let i = 6;
    i >= 0;
    i--
  ) {

    const date =
      new Date(today);


    date.setDate(
      today.getDate() - i
    );


    const dateString =
      formatDateForDatabase(
        date
      );


    const dayGoals =
      goals.filter(
        function (goal) {

          return (
            goal.goal_date ===
            dateString
          );

        }
      );


    const total =
      dayGoals.length;


    const completed =
      dayGoals.filter(
        function (goal) {
          return goal.completed;
        }
      ).length;


    const percent =
      total === 0
        ? 0
        : Math.round(
            (
              completed /
              total
            ) * 100
          );


    points.push({

      date:
        date,

      percent:
        percent

    });

  }


  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 45;


  const chartWidth =
    width -
    paddingLeft -
    paddingRight;


  const chartHeight =
    height -
    paddingTop -
    paddingBottom;


  /*
    Background
  */

  ctx.fillStyle =
    "#ffffff";

  ctx.fillRect(
    0,
    0,
    width,
    height
  );


  /*
    Horizontal grid lines
  */

  ctx.strokeStyle =
    "#e5e7eb";

  ctx.lineWidth =
    1;


  for (
    let value = 0;
    value <= 100;
    value += 25
  ) {

    const y =
      paddingTop +
      chartHeight -
      (
        value /
        100
      ) *
      chartHeight;


    ctx.beginPath();

    ctx.moveTo(
      paddingLeft,
      y
    );

    ctx.lineTo(
      width - paddingRight,
      y
    );

    ctx.stroke();


    ctx.fillStyle =
      "#6b7280";

    ctx.font =
      "12px Arial";

    ctx.textAlign =
      "right";

    ctx.fillText(
      `${value}%`,
      paddingLeft - 8,
      y + 4
    );

  }


  /*
    Build points
  */

  const graphPoints =
    points.map(
      function (point, index) {

        const x =
          paddingLeft +
          (
            index /
            (points.length - 1)
          ) *
          chartWidth;


        const y =
          paddingTop +
          chartHeight -
          (
            point.percent /
            100
          ) *
          chartHeight;


        return {
          x: x,
          y: y,
          percent:
            point.percent,
          date:
            point.date
        };

      }
    );


  /*
    Area under graph
  */

  if (graphPoints.length > 1) {

    ctx.beginPath();

    ctx.moveTo(
      graphPoints[0].x,
      paddingTop +
        chartHeight
    );


    graphPoints.forEach(
      function (point) {

        ctx.lineTo(
          point.x,
          point.y
        );

      }
    );


    ctx.lineTo(
      graphPoints[
        graphPoints.length - 1
      ].x,
      paddingTop +
        chartHeight
    );


    ctx.closePath();

    ctx.fillStyle =
      "rgba(79, 70, 229, 0.10)";

    ctx.fill();

  }


  /*
    Main graph line
  */

  if (graphPoints.length > 0) {

    ctx.beginPath();

    graphPoints.forEach(
      function (point, index) {

        if (index === 0) {

          ctx.moveTo(
            point.x,
            point.y
          );

        } else {

          ctx.lineTo(
            point.x,
            point.y
          );

        }

      }
    );


    ctx.strokeStyle =
      "#4f46e5";

    ctx.lineWidth =
      3;

    ctx.lineJoin =
      "round";

    ctx.lineCap =
      "round";

    ctx.stroke();

  }


  /*
    Points + dates
  */

  graphPoints.forEach(
    function (point) {

      ctx.beginPath();

      ctx.arc(
        point.x,
        point.y,
        5,
        0,
        Math.PI * 2
      );


      ctx.fillStyle =
        "#4f46e5";

      ctx.fill();


      ctx.fillStyle =
        "#374151";

      ctx.font =
        "11px Arial";

      ctx.textAlign =
        "center";


      ctx.fillText(
        `${point.percent}%`,
        point.x,
        Math.max(
          12,
          point.y - 10
        )
      );


      ctx.fillStyle =
        "#6b7280";

      ctx.fillText(
        point.date.toLocaleDateString(
          undefined,
          {
            day: "numeric",
            month: "short"
          }
        ),
        point.x,
        height - 18
      );

    }
  );

}


/* =========================================================
   26. DATE CHANGE
========================================================= */

function changeDate(
  amount
) {

  currentDate.setDate(
    currentDate.getDate() +
      amount
  );


  currentYear =
    currentDate.getFullYear();


  updatePeriodView();

}


/* =========================================================
   27. DATE DISPLAY
========================================================= */

function updateDateDisplay() {

  if (
    !currentDateText ||
    !currentDateSubtext
  ) {
    return;
  }


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


  if (
    selected ===
    todayString
  ) {

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
   28. GREETING
========================================================= */

function setGreeting() {

  if (!greeting) {
    return;
  }


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
   29. STREAK
========================================================= */

function calculateStreak() {

  if (!currentUser) {

    if (streakCount) {
      streakCount.textContent =
        "0";
    }

    return;

  }


  let streak = 0;

  const date =
    new Date();


  for (
    let i = 0;
    i < 365;
    i++
  ) {

    const dateString =
      formatDateForDatabase(
        date
      );


    const dayGoals =
      goals.filter(
        function (goal) {

          return (
            goal.goal_date ===
            dateString
          );

        }
      );


    if (dayGoals.length === 0) {
      break;
    }


    const allCompleted =
      dayGoals.every(
        function (goal) {
          return goal.completed;
        }
      );


    if (!allCompleted) {
      break;
    }


    streak++;


    date.setDate(
      date.getDate() - 1
    );

  }


  if (streakCount) {

    streakCount.textContent =
      streak;

  }

}


/* =========================================================
   30. DATE HELPERS
========================================================= */

function formatDateForDatabase(
  date
) {

  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return `${year}-${month}-${day}`;

}


function formatShortDate(
  date
) {

  return date.toLocaleDateString(
    undefined,
    {
      weekday: "short",
      day: "numeric",
      month: "short"
    }
  );

}


function getStartOfWeek(
  date
) {

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


function isLeapYear(
  year
) {

  return (
    year % 4 === 0 &&
    (
      year % 100 !== 0 ||
      year % 400 === 0
    )
  );

}


/* =========================================================
   31. AUTH MESSAGE
========================================================= */

function showAuthMessage(
  message
) {

  if (authMessage) {

    authMessage.textContent =
      message;

  }

}


/* =========================================================
   32. LOADING
========================================================= */

function showLoading(
  show
) {

  if (!loadingScreen) {
    return;
  }


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


/* =========================================================
   33. RESIZE GRAPH
========================================================= */

window.addEventListener(
  "resize",
  function () {

    if (
      appScreen &&
      !appScreen.classList.contains(
        "hidden"
      )
    ) {

      const canvas =
        document.getElementById(
          "goalProgressCanvas"
        );


      if (canvas) {
        drawProgressChart(
          canvas
        );
      }

    }

  }
);
