"use client";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import React from "react";
import styles from "./featured.module.css";
import Image from "next/image";
import Slider from "react-slick";
import { Featuredost } from "@/types";
import Link from "next/link";

const Featured = () => {
  const featuredPosts: Featuredost[] = [
    {
      id: 1,
      title: "블로그 소개글 ",
      desc: "안녕하세요. 프론트엔드 개발자 장도진입니다.",
      image: "/zindozang.png",
    },
  ];

  const settings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
  };
  return (
    <div className={styles.container}>
      <div className={styles.featuredTitle}>
        안녕하세요. 블로그 <b>진도장</b> 입니다.
      </div>

      <Slider {...settings}>
        {featuredPosts.map((post: Featuredost, index: number) => (
          <div key={post.id} className={styles.slide}>
            <div className={styles.imgContainer}>
              <Image
                src={post.image}
                alt={post.title}
                fill
                className={styles.image}
                priority={index === 0}
                sizes="(max-width: 1024px) 90vw, (max-width: 1280px) 50vw, 33vw"
              />
            </div>
            <div className={styles.textContainer}>
              <h1 className={styles.postTitle}>{post.title}</h1>
              <p className={styles.postDesc}>{post.desc}</p>
              <Link href="/posts/intro반갑습니다" className={styles.button}>
                더 읽기
              </Link>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};
export default Featured;
