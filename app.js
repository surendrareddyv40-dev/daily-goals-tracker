/* =========================================================
   DAILY GOALS TRACKER
   Supabase + JavaScript
   Includes:
   - Login
   - Registration
   - Add goals
   - Complete goals
   - Delete goals
   - Daily / Weekly / Monthly / Yearly
   - Streak
   - Statistics
   - 7-day progress graph
   ========================================================= */


/* =========================================================
   1. SUPABASE CONNECTION
   ========================================================= */

const SUPABASE_URL =
  "https://bvzvrxftmeldsxzpvibq.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_URrHQtxJb_kGfyInNLyvbQ_EImnzyBE";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


/* =========================================================
   2. VARIABLES
   ========================================================= */

let currentUser = null;
let currentPeriod = "daily";
let currentDate = new Date();


/* =========================================================
   3. HELPER FUNCTIONS
   ========================================================= */

function $(id) {
  return document.getElementById(id);
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function displayDate(date) {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function addDays(date, amount) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + amount);
  return newDate;
}


/* =========================================================
   4. AUTH SCREEN
   ========================================================= */

const loginTab = $("loginTab");
const registerTab = $("registerTab");
const authForm = $("authForm");
const emailInput = $("email");
const passwordInput = $("password");
const authButton = $("authButton");
const authMessage = $("authMessage");


let authMode = "login";


if (loginTab) {
  loginTab.addEventListener("click", () => {
    authMode = "login";

    loginTab.classList.add("active");

    if (registerTab) {
      registerTab.classList.remove("active");
    }

    if (authButton) {
      authButton.textContent = "Login";
    }

    if (authMessage) {
      authMessage.textContent = "";
    }
  });
}


if (registerTab) {
  registerTab.addEventListener("click", () => {
    authMode = "register";

    registerTab.classList.add("active");

    if (loginTab) {
      loginTab.classList.remove("active");
    }

    if (authButton) {
      authButton.textContent = "Create Account";
    }

    if (authMessage) {
      authMessage.textContent = "";
    }
  });
}


if (authForm) {
  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      if (authMessage) {
        authMessage.textContent =
          "Please enter email and password.";
      }
      return;
    }

    if (authButton) {
      authButton.disabled = true;
      authButton.textContent = "Please wait...";
    }

    try {

      if (authMode === "register") {

        const { data, error } =
          await supabaseClient.auth.signUp({
            email: email,
            password: password
          });

        if (error) {
          throw error;
        }

        if (authMessage) {
          if (data.session) {
            authMessage.textContent =
              "Account created successfully!";
          } else {
            authMessage.textContent =
              "Account created! Check your email to verify your account.";
          }
        }

      } else {

        const { error } =
          await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
          });

        if (error) {
          throw error;
        }

        if (authMessage) {
          authMessage.textContent = "Login successful!";
        }
      }

    } catch (error) {

      console.error(error);

      if (authMessage) {
        authMessage.textContent = error.message;
      }

    } finally {

      if (authButton) {
        authButton.disabled = false;
        authButton.textContent =
          authMode === "login"
            ? "Login"
            : "Create Account";
      }
    }
  });
}


/* =========================================================
   5. SHOW / HIDE APP
   ========================================================= */

function showApp(user) {

  currentUser = user;

  const authScreen = $("authScreen");
  const appScreen = $("appScreen");

  if (authScreen) {
    authScreen.style.display = "none";
  }

  if (appScreen) {
    appScreen.style.display = "block";
  }

  const userEmail = $("userEmail");

  if (userEmail) {
    userEmail.textContent = user.email;
  }

  createProgressSection();

  loadGoals();
}


function showLogin() {

  currentUser = null;

  const authScreen = $("authScreen");
  const appScreen = $("appScreen");

  if (authScreen) {
    authScreen.style.display = "block";
  }

  if (appScreen) {
    appScreen.style.display = "none";
  }
}


/* =========================================================
   6. LOGOUT
   ========================================================= */

const logoutButton = $("logoutBtn");

if (logoutButton) {

  logoutButton.addEventListener("click", async () => {

    await supabaseClient.auth.signOut();

    showLogin();

  });

}


/* =========================================================
   7. CHECK LOGIN
   ========================================================= */

async function checkUser() {

  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (session && session.user) {

    showApp(session.user);

  } else {

    showLogin();

  }
}


supabaseClient.auth.onAuthStateChange(
  (_event, session) => {

    if (session && session.user) {

      showApp(session.user);

    } else {

      showLogin();

    }

  }
);


/* =========================================================
   8. PERIOD BUTTONS
   ========================================================= */

document.querySelectorAll("[data-period]").forEach(button => {

  button.addEventListener("click", () => {

    document
      .querySelectorAll("[data-period]")
      .forEach(btn => btn.classList.remove("active"));

    button.classList.add("active");

    currentPeriod = button.dataset.period;

    loadGoals();

  });

});


/* =========================================================
   9. DATE NAVIGATION
   ========================================================= */

const previousButton =
  $("prevDate") || $("previousDate");

const nextButton =
  $("nextDate");


if (previousButton) {

  previousButton.addEventListener("click", () => {

    if (currentPeriod === "daily") {
      currentDate = addDays(currentDate, -1);
    }

    if (currentPeriod === "weekly") {
      currentDate = addDays(currentDate, -7);
    }

    if (currentPeriod === "monthly") {
      currentDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      );
    }

    if (currentPeriod === "yearly") {
      currentDate = new Date(
        currentDate.getFullYear() - 1,
        0,
        1
      );
    }

    loadGoals();

  });

}


if (nextButton) {

  nextButton.addEventListener("click", () => {

    if (currentPeriod === "daily") {
      currentDate = addDays(currentDate, 1);
    }

    if (currentPeriod === "weekly") {
      currentDate = addDays(currentDate, 7);
    }

    if (currentPeriod === "monthly") {
      currentDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      );
    }

    if (currentPeriod === "yearly") {
      currentDate = new Date(
        currentDate.getFullYear() + 1,
        0,
        1
      );
    }

    loadGoals();

  });

}


/* =========================================================
   10. GET DATE RANGE
   ========================================================= */

function getDateRange() {

  let start;
  let end;

  if (currentPeriod === "daily") {

    start = new Date(currentDate);

    end = new Date(currentDate);

  }

  else if (currentPeriod === "weekly") {

    start = new Date(currentDate);

    const day = start.getDay();

    start.setDate(
      start.getDate() - day
    );

    end = addDays(start, 6);

  }

  else if (currentPeriod === "monthly") {

    start = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );

    end = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

  }

  else {

    start = new Date(
      currentDate.getFullYear(),
      0,
      1
    );

    end = new Date(
      currentDate.getFullYear(),
      11,
      31
    );

  }

  return {
    start: formatDate(start),
    end: formatDate(end)
  };
}


/* =========================================================
   11. LOAD GOALS
   ========================================================= */

async function loadGoals() {

  if (!currentUser) return;

  const range = getDateRange();

  const {
    data,
    error
  } = await supabaseClient
    .from("goals")
    .select("*")
    .eq("user_id", currentUser.id)
    .gte("goal_date", range.start)
    .lte("goal_date", range.end)
    .order("goal_date", {
      ascending: true
    })
    .order("created_at", {
      ascending: true
    });

  if (error) {

    console.error(error);

    return;

  }

  renderGoals(data || []);

  updateDateText();

  updateStatistics(data || []);

  updateProgressGraph();

  calculateStreak();

  if (currentPeriod === "yearly") {
    renderYearCalendar(data || []);
  }
}


/* =========================================================
   12. DATE TEXT
   ========================================================= */

function updateDateText() {

  const dateElement =
    $("currentDate");

  if (!dateElement) return;

  if (currentPeriod === "daily") {

    dateElement.textContent =
      displayDate(currentDate);

  }

  else if (currentPeriod === "weekly") {

    const start = new Date(currentDate);

    start.setDate(
      start.getDate() - start.getDay()
    );

    const end = addDays(start, 6);

    dateElement.textContent =
      `${displayDate(start)} - ${displayDate(end)}`;

  }

  else if (currentPeriod === "monthly") {

    dateElement.textContent =
      currentDate.toLocaleDateString(
        "en-IN",
        {
          month: "long",
          year: "numeric"
        }
      );

  }

  else {

    dateElement.textContent =
      currentDate.getFullYear();

  }

}


/* =========================================================
   13. RENDER GOALS
   ========================================================= */

function renderGoals(goals) {

  const list =
    $("goalsList");

  if (!list) return;

  list.innerHTML = "";

  if (goals.length === 0) {

    list.innerHTML = `
      <div style="
        text-align:center;
        padding:25px;
        opacity:.7;
      ">
        No goals yet.
      </div>
    `;

    return;
  }


  goals.forEach(goal => {

    const item =
      document.createElement("div");

    item.className = "goal-item";

    item.innerHTML = `

      <div style="
        display:flex;
        align-items:center;
        gap:12px;
        width:100%;
      ">

        <input
          type="checkbox"
          ${goal.completed ? "checked" : ""}
          style="
            width:20px;
            height:20px;
          "
        >

        <div style="flex:1">

          <div style="
            font-weight:600;
            text-decoration:
              ${goal.completed
                ? "line-through"
                : "none"};
          ">
            ${escapeHTML(goal.title)}
          </div>

          <small style="opacity:.6">
            ${goal.goal_date}
          </small>

        </div>

        <button
          class="delete-goal"
          style="
            border:none;
            background:transparent;
            font-size:20px;
            cursor:pointer;
          "
        >
          🗑️
        </button>

      </div>
    `;


    const checkbox =
      item.querySelector("input");

    checkbox.addEventListener(
      "change",
      () => toggleGoal(
        goal.id,
        checkbox.checked
      )
    );


    const deleteButton =
      item.querySelector(".delete-goal");

    deleteButton.addEventListener(
      "click",
      () => deleteGoal(goal.id)
    );


    list.appendChild(item);

  });

}


/* =========================================================
   14. ADD GOAL
   ========================================================= */

const addGoalButton =
  $("addGoalBtn");

const goalInput =
  $("goalInput") ||
  $("addGoalInput");

if (addGoalButton) {

  addGoalButton.addEventListener(
    "click",
    addGoal
  );

}


if (goalInput) {

  goalInput.addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {
        addGoal();
      }

    }
  );

}


async function addGoal() {

  if (!currentUser) return;

  const title =
    goalInput
      ? goalInput.value.trim()
      : "";

  if (!title) {

    alert("Please enter a goal.");

    return;

  }


  const selectedDate =
    formatDate(currentDate);


  const {
    error
  } = await supabaseClient
    .from("goals")
    .insert({
      user_id: currentUser.id,
      title: title,
      goal_date: selectedDate,
      completed: false
    });


  if (error) {

    console.error(error);

    alert(error.message);

    return;

  }


  goalInput.value = "";

  loadGoals();

}


/* =========================================================
   15. COMPLETE / UNCOMPLETE GOAL
   ========================================================= */

async function toggleGoal(
  goalId,
  completed
) {

  const {
    error
  } = await supabaseClient
    .from("goals")
    .update({
      completed: completed
    })
    .eq("id", goalId)
    .eq("user_id", currentUser.id);


  if (error) {

    console.error(error);

    alert(error.message);

    return;

  }


  loadGoals();

}


/* =========================================================
   16. DELETE GOAL
   ========================================================= */

async function deleteGoal(goalId) {

  const confirmDelete =
    confirm("Delete this goal?");

  if (!confirmDelete) return;


  const {
    error
  } = await supabaseClient
    .from("goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", currentUser.id);


  if (error) {

    console.error(error);

    alert(error.message);

    return;

  }


  loadGoals();

}


/* =========================================================
   17. STATISTICS
   ========================================================= */

function updateStatistics(goals) {

  const total =
    goals.length;

  const completed =
    goals.filter(
      goal => goal.completed
    ).length;

  const remaining =
    total - completed;

  const percentage =
    total === 0
      ? 0
      : Math.round(
          (completed / total) * 100
        );


  setText(
    "totalGoals",
    total
  );

  setText(
    "completedGoals",
    completed
  );

  setText(
    "remainingGoals",
    remaining
  );

  setText(
    "completionPercent",
    percentage + "%"
  );


  const progress =
    $("progressBar");

  if (progress) {

    progress.style.width =
      percentage + "%";

  }

}


function setText(id, value) {

  const element = $(id);

  if (element) {
    element.textContent = value;
  }

}


/* =========================================================
   18. CREATE GRAPH + STATISTICS PANEL
   ========================================================= */

function createProgressSection() {

  if (document.getElementById(
    "progressSection"
  )) {
    return;
  }


  const app =
    $("appScreen");

  if (!app) return;


  const section =
    document.createElement("section");

  section.id =
    "progressSection";


  section.style.cssText = `

    margin:20px 0;
    padding:20px;
    border-radius:18px;
    background:#15171b;
    border:1px solid #2b2f36;
    color:white;

  `;


  section.innerHTML = `

    <h2 style="
      margin-top:0;
      margin-bottom:18px;
    ">
      📊 Progress & Statistics
    </h2>


    <div style="
      display:grid;
      grid-template-columns:
        repeat(4,1fr);
      gap:10px;
      margin-bottom:25px;
    ">

      <div style="
        padding:14px 8px;
        text-align:center;
        background:#20242a;
        border-radius:12px;
      ">
        <div style="font-size:24px;font-weight:bold"
             id="totalGoals">
          0
        </div>
        <small>Total</small>
      </div>


      <div style="
        padding:14px 8px;
        text-align:center;
        background:#20242a;
        border-radius:12px;
      ">
        <div style="font-size:24px;font-weight:bold"
             id="completedGoals">
          0
        </div>
        <small>Done</small>
      </div>


      <div style="
        padding:14px 8px;
        text-align:center;
        background:#20242a;
        border-radius:12px;
      ">
        <div style="font-size:24px;font-weight:bold"
             id="remainingGoals">
          0
        </div>
        <small>Left</small>
      </div>


      <div style="
        padding:14px 8px;
        text-align:center;
        background:#20242a;
        border-radius:12px;
      ">
        <div style="font-size:24px;font-weight:bold"
             id="completionPercent">
          0%
        </div>
        <small>Progress</small>
      </div>

    </div>


    <h3 style="
      margin-bottom:12px;
    ">
      Last 7 Days
    </h3>


    <div id="progressGraph"
      style="
        display:flex;
        align-items:flex-end;
        justify-content:space-between;
        gap:8px;
        height:180px;
        padding:15px 5px 0;
        border-bottom:1px solid #3a3f47;
      ">
    </div>


    <div style="
      margin-top:18px;
    ">

      <div style="
        display:flex;
        justify-content:space-between;
        margin-bottom:8px;
      ">
        <span>Overall progress</span>
        <span id="progressText">0%</span>
      </div>

      <div style="
        width:100%;
        height:10px;
        background:#292d33;
        border-radius:10px;
        overflow:hidden;
      ">

        <div id="progressBar"
          style="
            width:0%;
            height:100%;
            background:#4ade80;
            border-radius:10px;
            transition:width .3s;
          ">
        </div>

      </div>

    </div>


    <div style="
      margin-top:18px;
      font-size:15px;
      opacity:.8;
    ">
      🔥 Current streak:
      <strong id="streakValue">
        0 days
      </strong>
    </div>

  `;


  app.appendChild(section);

}


/* =========================================================
   19. 7-DAY PROGRESS GRAPH
   ========================================================= */

async function updateProgressGraph() {

  if (!currentUser) return;


  const graph =
    $("progressGraph");

  if (!graph) return;


  const today =
    new Date();


  const dates = [];


  for (let i = 6; i >= 0; i--) {

    dates.push(
      addDays(today, -i)
    );

  }


  const start =
    formatDate(dates[0]);

  const end =
    formatDate(dates[6]);


  const {
    data,
    error
  } = await supabaseClient
    .from("goals")
    .select("goal_date,completed")
    .eq("user_id", currentUser.id)
    .gte("goal_date", start)
    .lte("goal_date", end);


  if (error) {

    console.error(error);

    return;

  }


  graph.innerHTML = "";


  dates.forEach(date => {

    const dateString =
      formatDate(date);


    const dayGoals =
      (data || []).filter(
        goal =>
          goal.goal_date === dateString
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


    const column =
      document.createElement("div");


    column.style.cssText = `

      flex:1;
      height:100%;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:flex-end;
      gap:7px;

    `;


    const value =
      document.createElement("div");


    value.textContent =
      percent + "%";


    value.style.cssText = `

      font-size:11px;
      opacity:.8;

    `;


    const barArea =
      document.createElement("div");


    barArea.style.cssText = `

      width:100%;
      max-width:35px;
      height:120px;
      display:flex;
      align-items:flex-end;
      background:#20242a;
      border-radius:8px 8px 3px 3px;
      overflow:hidden;

    `;


    const bar =
      document.createElement("div");


    bar.style.cssText = `

      width:100%;
      height:${percent}%;
      background:#4ade80;
      border-radius:8px 8px 0 0;
      transition:height .4s;

    `;


    barArea.appendChild(bar);


    const label =
      document.createElement("div");


    label.textContent =
      date.toLocaleDateString(
        "en-IN",
        {
          weekday:"short"
        }
      ).slice(0,3);


    label.style.cssText = `

      font-size:11px;
      opacity:.7;

    `;


    column.appendChild(value);

    column.appendChild(barArea);

    column.appendChild(label);


    graph.appendChild(column);

  });


}


/* =========================================================
   20. STREAK
   ========================================================= */

async function calculateStreak() {

  if (!currentUser) return;


  const {
    data,
    error
  } = await supabaseClient
    .from("goals")
    .select("goal_date,completed")
    .eq("user_id", currentUser.id)
    .order("goal_date", {
      ascending:false
    });


  if (error) {

    console.error(error);

    return;

  }


  const grouped = {};


  (data || []).forEach(goal => {

    if (!grouped[goal.goal_date]) {

      grouped[goal.goal_date] = [];

    }

    grouped[goal.goal_date].push(goal);

  });


  let streak = 0;

  let date = new Date();


  while (true) {

    const key =
      formatDate(date);


    const goals =
      grouped[key];


    if (!goals || goals.length === 0) {
      break;
    }


    const allDone =
      goals.every(
        goal => goal.completed
      );


    if (!allDone) {
      break;
    }


    streak++;

    date =
      addDays(date, -1);

  }


  setText(
    "streakValue",
    streak + " day" +
    (streak === 1 ? "" : "s")
  );


  setText(
    "streak",
    streak + " days"
  );

}


/* =========================================================
   21. YEAR CALENDAR
   ========================================================= */

function renderYearCalendar(goals) {

  const calendar =
    $("yearCalendar");

  if (!calendar) return;


  calendar.innerHTML = "";


  const grouped = {};


  goals.forEach(goal => {

    if (!grouped[goal.goal_date]) {

      grouped[goal.goal_date] = [];

    }

    grouped[goal.goal_date].push(goal);

  });


  const year =
    currentDate.getFullYear();


  for (
    let month = 0;
    month < 12;
    month++
  ) {

    const monthBox =
      document.createElement("div");


    monthBox.style.cssText = `

      margin-bottom:20px;

    `;


    const title =
      document.createElement("h4");


    title.textContent =
      new Date(
        year,
        month,
        1
      ).toLocaleDateString(
        "en-IN",
        {
          month:"long"
        }
      );


    monthBox.appendChild(title);


    const days =
      new Date(
        year,
        month + 1,
        0
      ).getDate();


    const grid =
      document.createElement("div");


    grid.style.cssText = `

      display:grid;
      grid-template-columns:
        repeat(7,1fr);
      gap:4px;

    `;


    for (
      let day = 1;
      day <= days;
      day++
    ) {

      const date =
        new Date(
          year,
          month,
          day
        );


      const key =
        formatDate(date);


      const dayGoals =
        grouped[key] || [];


      const done =
        dayGoals.length > 0 &&
        dayGoals.every(
          goal => goal.completed
        );


      const box =
        document.createElement("div");


      box.textContent = day;


      box.style.cssText = `

        aspect-ratio:1;
        display:flex;
        align-items:center;
        justify-content:center;
        border-radius:5px;
        font-size:11px;
        background:
          ${
            done
              ? "#4ade80"
              : dayGoals.length
                ? "#555b64"
                : "#24282e"
          };
        color:
          ${
            done
              ? "#07130b"
              : "white"
          };

      `;


      grid.appendChild(box);

    }


    monthBox.appendChild(grid);

    calendar.appendChild(monthBox);

  }

}


/* =========================================================
   22. START APPLICATION
   ========================================================= */

checkUser();
