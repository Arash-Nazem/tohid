let current="login"
let signup_btn=document.querySelector(".sign")
let login_btn=document.querySelector(".log")
let container=document.querySelector(".container")
signup_btn.addEventListener("click" , (e)=>{
    if(current==="login"){
        container.classList.remove("login-present")
        container.classList.add("signup-present")
        current="signup"
        login_btn.classList.remove("active")
        signup_btn.classList.add("active")
    }
})
login_btn.addEventListener("click" , (e)=>{
    if(current==="signup"){
        container.classList.remove("signup-present")
        container.classList.add("login-present")
        current="login"

        signup_btn.classList.remove("active")
        login_btn.classList.add("active")
    }
})


document.querySelectorAll(".see-pass").forEach(e=>{
    
    e.addEventListener("click" , e=>{
        if(e.target.previousElementSibling.type === "password"){
            e.target.previousElementSibling.type="text"
            e.target.classList.remove("fa-eye")
            e.target.classList.add("fa-eye-slash")
        }else if(e.target.previousElementSibling.type === "text"){
            e.target.previousElementSibling.type="password"
            e.target.classList.remove("fa-eye-slash")
            e.target.classList.add("fa-eye")
        }
    })
})