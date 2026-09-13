/* =========================================================
   DAILY GOALS TRACKER
   Supabase + JavaScript
   ========================================================= */

/* =========================
   1. SUPABASE CONNECTION
   ========================= */

const SUPABASE_URL =
  "https://bvzvrxftmeldsxzpvibq.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_URrHQtxJb_kGfyInNLyvbQ_EImnzyBE";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


/* =========================
   2. APP STATE
   ========================= */

let currentUser = null;
let currentDate = new Date();
let currentPeriod = "daily";
let allGoals = [];


/* =========================
   3. HELPER FUNCTIONS
   ========================= */

function $(id) {
  return document.getElementById(id);
}

function todayString() {
  return new Date().toISOString().split("T")[0];
}

function dateString(date) {
  return date.toISOString().split("T")[0];
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function getEndOfWeek(date) {
  const d = getStartOfWeek(date);
  d.setDate(d.getDate() + 6);
  return d;
}

function getStartOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getEndOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatShortDate(date) {
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short"
  });
}


/* =========================
   4. AUTH SCREEN
   ========================= */

async function checkUser() {
  const { data } = await supabaseClient.auth.getSession();

  if (data && data.session) {
    currentUser = data.session.user;
    showDashboard();
    await loadGoals();
  } else {
    currentUser = null;
    showAuth();
  }
}


function showAuth() {
  const auth = $("auth-screen");
  const dashboard = $("dashboard");

  if (auth) auth.style.display = "";
  if (dashboard) dashboard.style.display = "none";
}


function showDashboard() {
  const auth = $("auth-screen");
  const dashboard = $("dashboard");

  if (auth) auth.style.display = "none";
  if (dashboard) dashboard.style.display = "";

  updateUserInfo();
}


function updateUserInfo() {
  if (!currentUser) return;

  const emailElements = document.querySelectorAll(
    "#user-email, .user-email"
  );

  emailElements.forEach(el => {
    el.textContent = currentUser.email || "";
  });
}


/* =========================
   5. REGISTER
   ========================= */

async function registerUser(email, password) {
  const { data, error } =
    await supabaseClient.auth.signUp({
      email: email.trim(),
      password: password
    });

  if (error) {
    alert(error.message);
    return false;
  }

  if (data.user && !data.session) {
    alert(
      "Registration successful! Please check your email and verify your account."
    );
  } else {
    alert("Registration successful!");
  }

  return true;
}


/* =========================
   6. LOGIN
   ========================= */

async function loginUser(email, password) {
  const { data, error } =
    await supabaseClient.auth.signInWithPassword({
      email: email.trim(),
      password: password
    });

  if (error) {
    alert(error.message);
    return false;
  }

  currentUser = data.user;

  showDashboard();
  await loadGoals();

  return true;
}


/* =========================
   7. LOGOUT
   ========================= */

async function logoutUser() {
  await supabaseClient.auth.signOut();

  currentUser = null;
  allGoals = [];

  showAuth();
}


/* =========================
   8. LOAD GOALS
   ========================= */

async function loadGoals() {
  if (!currentUser) return;

  const { data, error } = await supabaseClient
    .from("goals")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("goal_date", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    alert("Could not load goals: " + error.message);
    return;
  }

  allGoals = data || [];

  renderEverything();
}


/* =========================
   9. ADD GOAL
   ========================= */

async function addGoal(title, goalDate) {
  if (!currentUser) {
    alert("Please login first.");
    return;
  }

  title = title.trim();

  if (!title) {
    alert("Please enter a goal.");
    return;
  }

  if (!goalDate) {
    goalDate = todayString();
  }

  const { error } = await supabaseClient
    .from("goals")
    .insert({
      user_id: currentUser.id,
      title: title,
      goal_date: goalDate,
      completed: false
    });

  if (error) {
    console.error(error);
    alert("Could not add goal: " + error.message);
    return;
  }

  await loadGoals();
}


/* =========================
   10. TOGGLE GOAL
   ========================= */

async function toggleGoal(id, completed) {
  const { error } = await supabaseClient
    .from("goals")
    .update({
      completed: completed
    })
    .eq("id", id)
    .eq("user_id", currentUser.id);

  if (error) {
    alert(error.message);
    return;
  }

  await loadGoals();
}


/* =========================
   11. DELETE GOAL
   ========================= */

async function deleteGoal(id) {
  if (!confirm("Delete this goal?")) return;

  const { error } = await supabaseClient
    .from("goals")
    .delete()
    .eq("id", id)
    .eq("user_id", currentUser.id);

  if (error) {
    alert(error.message);
    return;
  }

  await loadGoals();
}


/* =========================
   12. GET PERIOD GOALS
   ========================= */

function getPeriodGoals() {
  if (!allGoals.length) return [];

  let start;
  let end;

  if (currentPeriod === "daily") {
    start = dateString(currentDate);
    end = start;
  }

  if (currentPeriod === "weekly") {
    start = dateString(getStartOfWeek(currentDate));
    end = dateString(getEndOfWeek(currentDate));
  }

  if (currentPeriod === "monthly") {
    start = dateString(getStartOfMonth(currentDate));
    end = dateString(getEndOfMonth(currentDate));
  }

  if (currentPeriod === "yearly") {
    start = `${currentDate.getFullYear()}-01-01`;
    end = `${currentDate.getFullYear()}-12-31`;
  }

  return allGoals.filter(goal =>
    goal.goal_date >= start &&
    goal.goal_date <= end
  );
}


/* =========================
   13. CALCULATE STATISTICS
   ========================= */

function calculateStats(goals) {
  const total = goals.length;

  const completed = goals.filter(
    goal => goal.completed
  ).length;

  const remaining = total - completed;

  const percentage =
    total === 0
      ? 0
      : Math.round((completed / total) * 100);

  return {
    total,
    completed,
    remaining,
    percentage
  };
}


/* =========================
   14. STREAK
   ========================= */

function calculateStreak() {
  let streak = 0;

  const date = new Date();

  while (true) {
    const day = dateString(date);

    const goals = allGoals.filter(
      goal => goal.goal_date === day
    );

    if (goals.length === 0) {
      break;
    }

    const complete = goals.every(
      goal => goal.completed
    );

    if (!complete) {
      break;
    }

    streak++;

    date.setDate(date.getDate() - 1);
  }

  return streak;
}


/* =========================
   15. RENDER EVERYTHING
   ========================= */

function renderEverything() {
  renderDateTitle();
  renderGoals();
  renderStats();
  renderGraph();
  renderStreak();
}


/* =========================
   16. DATE TITLE
   ========================= */

function renderDateTitle() {
  const title =
    $("period-title") ||
    $("date-title") ||
    $("current-date");

  if (!title) return;

  if (currentPeriod === "daily") {
    title.textContent = formatDate(currentDate);
  }

  if (currentPeriod === "weekly") {
    title.textContent =
      `${formatShortDate(
        getStartOfWeek(currentDate)
      )} - ${formatShortDate(
        getEndOfWeek(currentDate)
      )}`;
  }

  if (currentPeriod === "monthly") {
    title.textContent =
      currentDate.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric"
      });
  }

  if (currentPeriod === "yearly") {
    title.textContent =
      String(currentDate.getFullYear());
  }
}


/* =========================
   17. RENDER GOALS
   ========================= */

function renderGoals() {
  const container =
    $("goals-list") ||
    $("goals") ||
    $("goal-list");

  if (!container) return;

  const goals = getPeriodGoals();

  if (goals.length === 0) {
    container.innerHTML = `
      <div class="empty-goals">
        <div style="font-size:40px;">🎯</div>
        <h3>No goals yet</h3>
        <p>Add your first goal!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = goals.map(goal => `
    <div class="goal-item"
         style="
         display:flex;
         align-items:center;
         gap:12px;
         padding:14px;
         margin-bottom:10px;
         border-radius:12px;
         border:1px solid rgba(128,128,128,.25);
         ">
      
      <input
        type="checkbox"
        ${goal.completed ? "checked" : ""}
        onchange="
          window.toggleGoalFromUI(
            ${goal.id},
            this.checked
          )
        "
        style="width:22px;height:22px;"
      >

      <div style="flex:1;">
        <div style="
          font-size:16px;
          ${goal.completed
            ? "text-decoration:line-through;opacity:.55;"
            : ""}
        ">
          ${escapeHTML(goal.title)}
        </div>

        <small style="opacity:.6;">
          ${goal.goal_date}
        </small>
      </div>

      <button
        onclick="window.deleteGoalFromUI(${goal.id})"
        style="
        border:0;
        background:none;
        cursor:pointer;
        font-size:20px;
        ">
        🗑️
      </button>

    </div>
  `).join("");
}


/* =========================
   18. RENDER STATS
   ========================= */

function renderStats() {
  const goals = getPeriodGoals();
  const stats = calculateStats(goals);

  const total =
    $("total-goals") ||
    $("totalGoals");

  const completed =
    $("completed-goals") ||
    $("completedGoals");

  const remaining =
    $("remaining-goals") ||
    $("remainingGoals");

  const percentage =
    $("progress-percentage") ||
    $("progressPercentage");

  if (total) total.textContent = stats.total;
  if (completed) completed.textContent = stats.completed;
  if (remaining) remaining.textContent = stats.remaining;
  if (percentage) percentage.textContent =
    stats.percentage + "%";


  /* Create statistics card if HTML doesn't have one */
  let statsBox = $("auto-statistics");

  if (!statsBox) {
    const dashboard =
      $("dashboard") ||
      document.body;

    statsBox = document.createElement("div");
    statsBox.id = "auto-statistics";

    statsBox.style.cssText = `
      margin:20px 0;
      padding:20px;
      border-radius:18px;
      background:rgba(128,128,128,.10);
    `;

    dashboard.appendChild(statsBox);
  }

  statsBox.innerHTML = `
    <h2 style="margin-top:0;">📊 Progress Statistics</h2>

    <div style="
      display:grid;
      grid-template-columns:
      repeat(3,1fr);
      gap:10px;
    ">

      <div>
        <strong style="font-size:24px;">
          ${stats.total}
        </strong>
        <br>
        <small>Total</small>
      </div>

      <div>
        <strong style="font-size:24px;">
          ${stats.completed}
        </strong>
        <br>
        <small>Completed</small>
      </div>

      <div>
        <strong style="font-size:24px;">
          ${stats.percentage}%
        </strong>
        <br>
        <small>Progress</small>
      </div>

    </div>

    <div style="
      margin-top:15px;
      height:12px;
      background:#ddd;
      border-radius:20px;
      overflow:hidden;
    ">
      <div style="
        width:${stats.percentage}%;
        height:100%;
        background:#22c55e;
        transition:.4s;
      "></div>
    </div>
  `;
}


/* =========================
   19. STREAK
   ========================= */

function renderStreak() {
  const streak = calculateStreak();

  const elements = document.querySelectorAll(
    "#streak, #current-streak, .streak-number"
  );

  elements.forEach(el => {
    el.textContent = streak;
  });
}


/* =========================
   20. PROGRESS GRAPH
   ========================= */

function renderGraph() {
  let graph = $("progress-graph");

  if (!graph) {
    const dashboard =
      $("dashboard") ||
      document.body;

    graph = document.createElement("div");
    graph.id = "progress-graph";

    graph.style.cssText = `
      margin:20px 0;
      padding:20px;
      border-radius:18px;
      background:rgba(128,128,128,.10);
    `;

    dashboard.appendChild(graph);
  }

  const days = [];
  const values = [];

  const start =
    currentPeriod === "daily"
      ? new Date(currentDate)
      : currentPeriod === "weekly"
      ? getStartOfWeek(currentDate)
      : currentPeriod === "monthly"
      ? getStartOfMonth(currentDate)
      : new Date(currentDate.getFullYear(), 0, 1);

  let count =
    currentPeriod === "daily"
      ? 1
      : currentPeriod === "weekly"
      ? 7
      : currentPeriod === "monthly"
      ? new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0
        ).getDate()
      : 12;

  for (let i = 0; i < count; i++) {
    const d = new Date(start);

    if (currentPeriod === "yearly") {
      d.setMonth(i);
    } else {
      d.setDate(start.getDate() + i);
    }

    const ds = dateString(d);

    const dayGoals = allGoals.filter(
      goal => goal.goal_date === ds
    );

    const percentage =
      dayGoals.length === 0
        ? 0
        : Math.round(
            dayGoals.filter(g => g.completed).length /
            dayGoals.length *
            100
          );

    days.push(
      currentPeriod === "yearly"
        ? d.toLocaleDateString(undefined, {
            month: "short"
          })
        : d.getDate()
    );

    values.push(percentage);
  }


  /* SVG graph */

  const width = 700;
  const height = 240;
  const padding = 35;

  const maxValue = 100;

  const points = values.map((value, index) => {
    const x =
      padding +
      (index *
        (width - padding * 2)) /
        Math.max(values.length - 1, 1);

    const y =
      height -
      padding -
      (value / maxValue) *
        (height - padding * 2);

    return `${x},${y}`;
  }).join(" ");


  const circles = values.map((value, index) => {
    const x =
      padding +
      (index *
        (width - padding * 2)) /
        Math.max(values.length - 1, 1);

    const y =
      height -
      padding -
      (value / maxValue) *
        (height - padding * 2);

    return `
      <circle
        cx="${x}"
        cy="${y}"
        r="4"
        fill="#22c55e"
      />
    `;
  }).join("");


  graph.innerHTML = `
    <h2 style="margin-top:0;">
      📈 Progress Graph
    </h2>

    <div style="
      width:100%;
      overflow-x:auto;
    ">

      <svg
        viewBox="0 0 ${width} ${height}"
        width="100%"
        style="min-width:500px;"
      >

        <line
          x1="${padding}"
          y1="${height-padding}"
          x2="${width-padding}"
          y2="${height-padding}"
          stroke="currentColor"
          opacity=".2"
        />

        <line
          x1="${padding}"
          y1="${padding}"
          x2="${padding}"
          y2="${height-padding}"
          stroke="currentColor"
          opacity=".2"
        />

        <polyline
          points="${points}"
          fill="none"
          stroke="#22c55e"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        ${circles}

      </svg>

    </div>

    <div style="
      display:flex;
      justify-content:space-between;
      opacity:.6;
      font-size:12px;
    ">
      <span>0%</span>
      <span>50%</span>
      <span>100%</span>
    </div>
  `;
}


/* =========================
   21. PERIOD BUTTONS
   ========================= */

function setPeriod(period) {
  currentPeriod = period;

  document
    .querySelectorAll(
      "[data-period]"
    )
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.period === period
      );
    });

  renderEverything();
}


/* =========================
   22. PREVIOUS / NEXT
   ========================= */

function previousPeriod() {
  if (currentPeriod === "daily") {
    currentDate.setDate(
      currentDate.getDate() - 1
    );
  }

  if (currentPeriod === "weekly") {
    currentDate.setDate(
      currentDate.getDate() - 7
    );
  }

  if (currentPeriod === "monthly") {
    currentDate.setMonth(
      currentDate.getMonth() - 1
    );
  }

  if (currentPeriod === "yearly") {
    currentDate.setFullYear(
      currentDate.getFullYear() - 1
    );
  }

  renderEverything();
}


function nextPeriod() {
  if (currentPeriod === "daily") {
    currentDate.setDate(
      currentDate.getDate() + 1
    );
  }

  if (currentPeriod === "weekly") {
    currentDate.setDate(
      currentDate.getDate() + 7
    );
  }

  if (currentPeriod === "monthly") {
    currentDate.setMonth(
      currentDate.getMonth() + 1
    );
  }

  if (currentPeriod === "yearly") {
    currentDate.setFullYear(
      currentDate.getFullYear() + 1
    );
  }

  renderEverything();
}


/* =========================
   23. TODAY
   ========================= */

function goToday() {
  currentDate = new Date();
  renderEverything();
}


/* =========================
   24. FORM CONNECTION
   ========================= */

function connectForms() {

  /* Login */

  const loginForm =
    $("login-form") ||
    $("loginForm");

  if (loginForm) {
    loginForm.addEventListener(
      "submit",
      async function(e) {
        e.preventDefault();

        const email =
          loginForm.querySelector(
            'input[type="email"]'
          )?.value;

        const password =
          loginForm.querySelector(
            'input[type="password"]'
          )?.value;

        if (email && password) {
          await loginUser(
            email,
            password
          );
        }
      }
    );
  }


  /* Register */

  const registerForm =
    $("register-form") ||
    $("registerForm");

  if (registerForm) {
    registerForm.addEventListener(
      "submit",
      async function(e) {
        e.preventDefault();

        const email =
          registerForm.querySelector(
            'input[type="email"]'
          )?.value;

        const password =
          registerForm.querySelector(
            'input[type="password"]'
          )?.value;

        if (email && password) {
          await registerUser(
            email,
            password
          );
        }
      }
    );
  }


  /* Add goal */

  const addForm =
    $("goal-form") ||
    $("add-goal-form") ||
    $("addGoalForm");

  if (addForm) {
    addForm.addEventListener(
      "submit",
      async function(e) {
        e.preventDefault();

        const input =
          addForm.querySelector(
            'input[type="text"]'
          );

        const dateInput =
          addForm.querySelector(
            'input[type="date"]'
          );

        if (input) {
          await addGoal(
            input.value,
            dateInput?.value ||
            dateString(currentDate)
          );

          input.value = "";
        }
      }
    );
  }
}


/* =========================
   25. GLOBAL BUTTONS
   ========================= */

window.toggleGoalFromUI =
  function(id, checked) {
    toggleGoal(id, checked);
  };

window.deleteGoalFromUI =
  function(id) {
    deleteGoal(id);
  };

window.addGoal =
  addGoal;

window.loginUser =
  loginUser;

window.registerUser =
  registerUser;

window.logoutUser =
  logoutUser;

window.setPeriod =
  setPeriod;

window.previousPeriod =
  previousPeriod;

window.nextPeriod =
  nextPeriod;

window.goToday =
  goToday;


/* =========================
   26. AUTH STATE LISTENER
   ========================= */

supabaseClient.auth.onAuthStateChange(
  async (event, session) => {

    if (session) {
      currentUser = session.user;

      showDashboard();

      /*
       * Small timeout prevents Supabase
       * auth callback conflicts.
       */
      setTimeout(
        () => loadGoals(),
        0
      );

    } else {
      currentUser = null;
      allGoals = [];

      showAuth();
    }
  }
);


/* =========================
   27. START APP
   ========================= */

document.addEventListener(
  "DOMContentLoaded",
  async function() {

    connectForms();

    /*
     * Period buttons
     */

    document
      .querySelectorAll(
        "[data-period]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {
            setPeriod(
              button.dataset.period
            );
          }
        );

      });


    /*
     * Previous button
     */

    const previous =
      $("previous-btn") ||
      $("prev-btn") ||
      $("previous");

    if (previous) {
      previous.addEventListener(
        "click",
        previousPeriod
      );
    }


    /*
     * Next button
     */

    const next =
      $("next-btn") ||
      $("next");

    if (next) {
      next.addEventListener(
        "click",
        nextPeriod
      );
    }


    /*
     * Today button
     */

    const today =
      $("today-btn") ||
      $("today");

    if (today) {
      today.addEventListener(
        "click",
        goToday
      );
    }


    /*
     * Logout
     */

    const logout =
      $("logout-btn") ||
      $("logout");

    if (logout) {
      logout.addEventListener(
        "click",
        logoutUser
      );
    }


    /*
     * Check logged-in user
     */

    await checkUser();

  }
);
