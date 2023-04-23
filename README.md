# HackAGH Capgemini 2023 - winning project

## Overview
This project was developed during a 12 hour [HackAGH 2023](https://hack.samorzad.agh.edu.pl/) hackathon, organized by [AGH UST](https://www.linkedin.com/company/urss-agh/) in collaboration with [Capgemini Engineering](https://www.capgemini.com/us-en/about-us/who-we-are/our-brands/capgemini-engineering/).

## Objective
The objective was to create an app designated to improve in any way functionality of cars in our day-to-day lives.

## Solution

Our solution focused on solving three main issues:

- Keeping the battery charged at 100% is detrimental to its health
- It takes a significant amount of time to heat the car up in the morning
- The car can be hundreds of kilometers away before we notice the fact that it was stolen

Solutions to the above problems:
- Remote climate control
- Scheduled heating and topping up the battery, just before you leave your home
- Constant car location monitoring, also useful for crowded parking lots
- Theft prevention. If the car starts without an owner nearby, an alarm is triggered

Additionally, we've created a car simulation for testing the above features and a webserver for managing the connections together with the business logic.

## Tech Stack

This was achieved using the following technologies:
- Mobile app - React Native
- Car simulation - React
- Managing server - Python with FastAPI

Everything was connected using WebSockets.

## Screenshots
### Simulator panel
![simulator panel screenshot](https://user-images.githubusercontent.com/44680063/233863187-b9a66a9a-a51e-48eb-96c8-999f67a0361b.png)
### Mobile app
![mobile app screenshots](https://user-images.githubusercontent.com/44680063/233863237-359cafdc-c327-443c-8adf-b0c672fa16f6.png)
