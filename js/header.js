// let slider=document.querySelector(".slides-container")
// let slides=slider.childElementCount-1
// let widthslider=60;
// let clk=false;
// let prevmouse;

// let curentmouse;
// slider.addEventListener("mousedown" , e=>{
//     clk=true
//     prevmouse=e.clientX
// } )
// slider.addEventListener("mousemove" , e=>{
//     if(clk===true){
//         curentmouse=e.clientX
//         console.log(slider.style.left)
        
//         if(curentmouse>prevmouse && parseInt(slider.style.left.slice(0,-2))>-1*slides*widthslider )(

//             slider.style.left=-(curentmouse-prevmouse) + "vw"
//         )
        
//     }
// } )

// slider.addEventListener("mouseup" , e=>{
//     clk=false
// } )



const container = document.querySelector(".slides-container");
const slides = Array.from(document.querySelectorAll(".slide"));
const total = slides.length;

let index = 0;

slides.forEach(slide => {
    const clone = slide.cloneNode(true);
    container.appendChild(clone);
});

function slideMove() {
    index++;
    container.classList.add("animate");
    container.style.left = `-${index * 100}vw`;

    if (index === total) {
        setTimeout(() => {
            container.classList.remove("animate");
            container.style.left = "0vw";
            index = 0;
        }, 450);
    }
}

setInterval(slideMove, 2500);
