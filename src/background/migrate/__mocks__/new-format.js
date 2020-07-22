import dedent from 'dedent';

export default {
  'www.google.com': {
    css:
      dedent`
    #rcnt {
      font-variant: small-caps;
      text-decoration: underline;
      text-transform: capitalize;
    }
    
    div.WE0UJf {
      font-family: Georgia;
    }
    
    h3.LC20lb.DKV0Md {
      border-style: dashed;
      width: 37px;
    }
    
    h3.LC20lb.MMgsKf {
      border-color: #ff03ff;
      border-style: solid;
      border-width: 1px;
    }
    
    input {
      margin: 20px;
    }` + '\n\n',

    enabled: false,
    readability: false,
  },
  'ankitahuja.com': {
    css:
      dedent`
      a {
        font-variant: small-caps;
        color: red;
      }` + '\n\n',
    enabled: true,
    readability: false,
  },
  'github.com': {
    css: '',
    enabled: true,
    readability: false,
  },
};
