<template>
    <div>
        <div class="loading"></div>
    </div>
</template>

<style>
    .loading {
        min-height: 5rem;
        margin-bottom: 2rem;
    }
    
    .loading::after {
        height: 5rem;
        width: 5rem;
        margin-left: -2.5rem;
        margin-right: -2.5rem;
        border-radius: 2.5rem;
        border-color: #fff;
        border-right-color: transparent;
        border-top-color: transparent;
    }
</style>
