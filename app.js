/* =====================================================
   FEDEX ADMIN - COMMON ACTIVITY SYSTEM
   ===================================================== */


/* ================= ADD ACTIVITY ================= */

function addActivity(text, icon = "🔔") {

    let activities =
        JSON.parse(
            localStorage.getItem("fedexActivities")
        ) || [];


    const activity = {

        id: Date.now(),

        text: text,

        icon: icon,

        time: new Date().toLocaleString()

    };


    activities.unshift(activity);


    /* Keep latest 20 activities */

    activities =
        activities.slice(0, 20);


    localStorage.setItem(
        "fedexActivities",
        JSON.stringify(activities)
    );

}



/* ================= GET ACTIVITIES ================= */

function getActivities() {

    return JSON.parse(
        localStorage.getItem("fedexActivities")
    ) || [];

}



/* ================= DISPLAY ACTIVITIES ================= */

function loadActivities() {

    const activityList =
        document.getElementById("activityList");


    if (!activityList) {
        return;
    }


    const activities =
        getActivities();


    activityList.innerHTML = "";


    if (activities.length === 0) {

        activityList.innerHTML = `

            <div class="activity-empty">

                📭 No recent activity

            </div>

        `;

        return;

    }


    activities
        .slice(0, 8)
        .forEach(function(activity) {

            const item =
                document.createElement("div");


            item.className =
                "activity-item";


            item.innerHTML = `

                <div class="activity-left">

                    <div class="activity-icon">

                        ${activity.icon}

                    </div>

                    <div>

                        <div class="activity-text">

                            ${activity.text}

                        </div>

                        <div class="activity-time">

                            ${activity.time}

                        </div>

                    </div>

                </div>

            `;


            activityList.appendChild(item);

        });

}



/* ================= CLEAR ACTIVITIES ================= */

function clearActivities() {

    if (
        confirm(
            "Are you sure you want to clear all recent activities?"
        )
    ) {

        localStorage.removeItem(
            "fedexActivities"
        );


        loadActivities();


        alert(
            "Recent activities cleared."
        );

    }

}



/* ================= CLOCK ================= */

function startClock() {

    const clock =
        document.getElementById("clock");


    if (!clock) {
        return;
    }


    function updateClock() {

        clock.innerText =
            new Date().toLocaleTimeString();

    }


    updateClock();


    setInterval(
        updateClock,
        1000
    );

}



/* ================= DARK MODE ================= */

function setupDarkMode() {

    const darkBtn =
        document.getElementById("darkBtn");


    const darkToggle =
        document.getElementById("darkToggle");


    const savedDarkMode =
        localStorage.getItem(
            "fedexDarkMode"
        );


    if (
        savedDarkMode === "true"
    ) {

        document.body.classList.add("dark");

    }


    function updateButton() {

        if (!darkBtn) {
            return;
        }


        if (
            document.body.classList.contains("dark")
        ) {

            darkBtn.innerText =
                "☀️ Light Mode";

        }

        else {

            darkBtn.innerText =
                "🌙 Dark Mode";

        }


        if (darkToggle) {

            darkToggle.checked =
                document.body.classList.contains("dark");

        }

    }


    if (darkBtn) {

        darkBtn.addEventListener(
            "click",
            function() {

                const enabled =
                    !document.body.classList.contains("dark");


                document.body.classList.toggle(
                    "dark",
                    enabled
                );


                localStorage.setItem(
                    "fedexDarkMode",
                    enabled
                );


                updateButton();


                addActivity(
                    enabled
                        ? "Dark mode enabled"
                        : "Light mode enabled",
                    enabled
                        ? "🌙"
                        : "☀️"
                );

            }
        );

    }


    if (darkToggle) {

        darkToggle.addEventListener(
            "change",
            function() {

                document.body.classList.toggle(
                    "dark",
                    this.checked
                );


                localStorage.setItem(
                    "fedexDarkMode",
                    this.checked
                );


                updateButton();

            }
        );

    }


    updateButton();

}



/* ================= LOGOUT ================= */

function logout() {

    if (
        confirm(
            "Are you sure you want to logout?"
        )
    ) {

        addActivity(
            "Admin logged out",
            "🚪"
        );


        alert(
            "Logged out successfully!"
        );

    }

}



/* ================= INITIALIZE ================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadActivities();

        startClock();

        setupDarkMode();

    }
);