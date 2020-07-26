<template>
  <div class="mt-5 pb-3 pt-2">
    <h5>Style URL Matching</h5>

    <p>
      By default, Stylebot editor uses the site's domain name to match styles to
      websites. You can edit the urls in the options page for more flexible
      matching.
    </p>

    <ul>
      <li class="pb-1">
        <code>docs.google.com</code>
        - Matches any URL with
        <code>docs.google.com</code>
        in it.
      </li>
    </ul>

    <h6 class="pt-3">Wildcards</h6>

    <ul>
      <li class="pb-3">
        <code>**</code>
        matches any character sequence.
        <ul>
          <li>
            <code>docs**</code>
            - Any URL beginning with
            <code>docs</code>
          </li>
        </ul>
      </li>

      <li class="pb-3">
        <code>*</code>
        matches any character sequence, until a
        <code>/</code>
        is found.
        <ul>
          <li class="pb-2">
            <code>docs*.google.com</code>
            - This will match
            <code>http://docs.google.com</code>
            ,
            <code>http://docs1.google.com</code>
            ,
            <code>http://docs2.google.com</code>
            and so on
          </li>
          <li>
            <code>*.ycombinator.com</code>
            - This will match
            <code>http://news.ycombinator.com</code>
            and
            <code>http://apps.ycombinator.com</code>
          </li>
        </ul>
      </li>

      <li>
        <code>,</code>
        separates a list of patterns. Matches a URL if any sub-pattern matches
        it.
        <ul>
          <li>
            <code>docs.google.com, spreadsheets.google.com</code>
            - Matches any URL with
            <code>docs.google.com</code>
            or
            <code>spreadsheets.google.com</code>
            in it.
          </li>
        </ul>
      </li>
    </ul>

    <h6 class="pt-3">RegEx</h6>

    <p>
      Stylebot treats a string as a regex if it start it with
      <code>^</code>
    </p>
    <ul>
      <li>
        <code>^http://www.reddit.com/$</code>
        - This matches only the Reddit homepage.
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheHelpTab',
});
</script>

<style lang="scss" scoped>
code {
  background-color: #eee;
  color: #333;
  padding: 2px 5px;
}
</style>
