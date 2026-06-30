$(function () {
  if ($(".service-swiper").length) {
    new Swiper(".service-swiper", {
      slidesPerView: 1,
      spaceBetween: 18,
      loop: true,
      speed: 700,
      pagination: {
        el: ".service-swiper-pagination",
        clickable: true
      },
      breakpoints: {
        769: {
          slidesPerView: 2,
          spaceBetween: 28
        },
        1201: {
          slidesPerView: 2,
          spaceBetween: 30
        }
      }
    });
  }
});
