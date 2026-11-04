# Lessons

- **CSS variables only inherit downwards.** Before using a variable in a new element's CSS, check which element JS sets it on: one set on a sibling (flick's `.flick-book`) never reaches it, and the whole declaration silently falls back. Set it on the shared parent.
